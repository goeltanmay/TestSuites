var fs = require('fs'),
    xml2js = require('xml2js'),
    child  = require('child_process');
var parser = new xml2js.Parser();
var Bluebird = require('bluebird')

var testReport =  '/simplecalc/target/surefire-reports/TEST-com.github.stokito.unitTestExample.calculator.CalculatorTest.xml';

// calculatePriority();
findFlaky();

async function findFlaky()
{
    stats = {}
    for( var i = 0; i < 20; i++ )
    {
        try{
            child.execSync('cd simplecalc; mvn test');
        }catch(e){}
        var contents = fs.readFileSync(__dirname + testReport)
        let xml2json = await Bluebird.fromCallback(cb => parser.parseString(contents, cb));
        var tests = readResults(xml2json);
        tests.forEach( e => {
          if (!(e.name in stats)){
              stats[e.name] = {"passed" : 0, "failed" : 0, "flakyness" : 0};
          }
          stats[e.name][e.status] += 1;
          if(stats[e.name]["failed"] > 0 && stats[e.name]["passed"] > 0){
              stats[e.name]["flakyness"] = stats[e.name]["failed"]/(stats[e.name]["failed"] + stats[e.name]["passed"])
          }
        });
    }
    console.log(stats);

}

function readResults(result)
{
    var tests = [];
    for( var i = 0; i < result.testsuite['$'].tests; i++ )
    {
        var testcase = result.testsuite.testcase[i];

        tests.push({
        name:   testcase['$'].name,
        time:   testcase['$'].time,
        status: testcase.hasOwnProperty('failure') ? "failed": "passed"
        });
    }
    return tests;
}

async function calculatePriority()
{
    try{
        child.execSync('cd simplecalc; mvn test');
    }catch(e){}
    var contents = fs.readFileSync(__dirname + testReport)
    let xml2json = await Bluebird.fromCallback(cb => parser.parseString(contents, cb));
    var tests = readResults(xml2json);

    var copy = tests.slice(0);
    copy.sort(function(a,b) {
        var x = a.status.toLowerCase();
        var y = b.status.toLowerCase();
        if (x != y) {
          return x < y ? -1 : x > y ? 1 : 0;
        }
        else {
          return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
        }
    });
    copy.forEach( e => console.log(e))
    a = []
    copy.forEach( e => a.push(e.name))
    console.log(a)
    return a
    // tests.forEach( e => console.log(e));
}
