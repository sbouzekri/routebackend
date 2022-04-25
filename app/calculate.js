const start = async (fileIn, fileOut, mainAddr, callback) => {
    const jsonTable = await excelToJson(fileIn);

    let ret = [];
    const totalCalcs = Object.keys(jsonTable).length
    const dates = Object.keys(jsonTable);
    let i = 0
    for (const date of dates) {
        callback({
            data: `Processing ${date}...`,
            progress: i / totalCalcs
        });
        let data = jsonTable[date];

        if (mainAddr) {
          data.origin = mainAddr;
          data.destination = mainAddr;
        }

        let obj = await callApiGoogle(data);
        let retData = await returnDataRoutesDay(obj);
        ret[date] = retData;
        i += 1;
    }

    await writeFinalFile(ret, fileOut);

    const fs = require('fs-extra');
    fs.unlinkSync(fileIn)

    callback({
        data: `Processing Complete`,
        progress: 1
    });
}

async function writeFinalFile(obj, fileOut){
    const Excel     = require('exceljs');
    const workbook  = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Final');

    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Origin', key: 'oc', width: 50 },
        { header: 'Destination', key: 'dc', width: 50 },
        { header: 'Disctance', key: 'distance', width: 11 },
    ]

    Object.keys(obj).forEach(async function(item){
        if(obj[item]){

            Object.keys(obj[item].steps).forEach(async function(item2){

                if(parseInt(item2) < obj[item].steps.length){
                    var addRow = {
                        date:item,
                        oc:obj[item].steps[item2].start,
                        dc:obj[item].steps[item2].end,
                        distance:parseFloat(obj[item].steps[item2].distance)/1000+'KMs',
                    }
                    worksheet.addRow(addRow);
                }
            });

        }
    });

    worksheet.addRow({});//empty row
    worksheet.addRow({});//empty row

    worksheet.addRow({date:'Date', oc:'Total KMs'});//label row

    //resume
    Object.keys(obj).forEach(async function(day){
        if(obj[day]){
            if(obj[day].total_distance>0){
                var addRow = {
                    date:day,
                    oc:obj[day].total_distance+'KMs'
                }
                worksheet.addRow(addRow);
            }

        }

    });

    await workbook.xlsx.writeFile(fileOut);
}

async function returnDataRoutesDay(obj){
    obj = JSON.parse(obj.body);
    if(obj.routes.length == 0){
        return false;
    }
    if(typeof obj.routes[0].legs === 'undefined'){
        return false;
    }

    var ret = {};

    //total distance day in meters
    var total_distance = 0;
    for (var i in obj.routes[0].legs) {
        if(parseInt(i)+parseInt(1) >= obj.routes[0].legs.length){
            break;
        }
        total_distance += obj.routes[0].legs[i].distance.value;
    }
    ret.total_distance = (total_distance / 1000); //kms

    //distance point to point
    var steps = []
    for (var x in obj.routes[0].legs) {
        if(parseInt(x)+parseInt(1) >= obj.routes[0].legs.length){
            break;
        }
        var from_to = {
            start:obj.routes[0].legs[x].start_address,
            end:obj.routes[0].legs[x].end_address,
            distance:obj.routes[0].legs[x].distance.value,
        }
        steps.push(from_to);
    }
    ret.steps = steps;
    return ret;

}

async function callApiGoogle(params) {

    const request = require('request');
    require('dotenv').config();

    const endpoint = 'https://maps.googleapis.com/maps/api/directions/json?';
    params.key = process.env.KEY;

    return new Promise(function(resolve, reject) {
        request({url:endpoint, qs:params}, function(err, response, body) {
            // resp = response.body;
            if (err) {
                reject(err);
                console.log(err)
            } else {
                resolve({
                  label:params.label,
                  body:body
                });
            }
        });
    })
}

async function excelToJson(fileIn){

    var Excel = require('exceljs');
    var workbook = new Excel.Workbook();
    var ret =  [];

    // await workbook.xlsx.readFile("xlsx/final_example.xlsx")
    await workbook.xlsx.readFile(fileIn)
        .then(function() {
            ws = workbook.getWorksheet("Arkusz1")

            var last_day = null;
            ws.eachRow(function(row, rowNumber) {

                if(rowNumber > 1 && row){
                    var date_day = row.values[1]
                    if(row.values[1].length!=10){
                        date_day = row.values[1].toISOString().split('T')[0];
                    }

                    var obj = { day:date_day, street:row.values[3], city:row.values[5] };
                    var addr = obj.street+', '+obj.city;

                    var params = {
                        origin:addr,
                        destination:addr
                    };

                    if(obj.day != last_day){//first
                        ret[obj.day] = params;
                        ret[obj.day].waypoints = 'optimize:true';
                    }
                    else{
                        ret[obj.day].waypoints = ret[obj.day].waypoints + '|' + addr;
                    }

                    last_day = obj.day;
                }

            });
        });

    return ret;
}

module.exports = {
    start
}
