const Ajv = require("ajv")
const fs = require("fs")
const ajv = new Ajv({ allErrors: true })
const expect = require('chai').expect

function formatErrors (errors) {
    if (!Array.isArray(errors)) {
        return ''
    }

    return errors.map(item => `${item.instancePath}: ${item.message}`).join(', ')
}  

function isSubdomain(host1, host2) {
    var tokens1 = host1.split(".");
    var tokens2 = host2.split(".");
    if (tokens1.length <= tokens2.length) {
        return false;
    }

    var idx1 = tokens1.length - 1;
    for (var idx2 = tokens2.length - 1; idx2 >= 0; idx2--) {
        if (tokens2[idx2] !== tokens1[idx1]) {
            return false;
        }
        idx1 -= 1;
    }

    return true;
}

const schema = JSON.parse(fs.readFileSync('./tests/schemas/android.json'))
const validate = ajv.compile(schema)
const list = JSON.parse(fs.readFileSync("app/android-tds.json"))

describe('validate android-tds', () => {
    it('should have a valid schema', () => {
        expect(validate(list)).to.be.equal(true, formatErrors(validate.errors))
    })
    it('should have not differing decisions between domains and their sub-domains', () => {
        // Temporary check until we figure out a better structure for our list (see https://app.asana.com/0/1164076839969833/1204452354987508/f)
        var hostnames = Object.keys(list['trackers']);
        for (var i = 0; i < hostnames.length; i++) {
            for (var j = i + 1; j < hostnames.length; j++) {
                var host1 = hostnames[i];
                var host2 = hostnames[j];
                if (isSubdomain(host1, host2) && list['trackers'][host1]['default'] === 'ignore') {
                    expect(list['trackers'][host2]['default']).to.be.equal('ignore', host2 + ' decision differs from sub-domain ' + host1)
                }
            }
        }
    })
})
