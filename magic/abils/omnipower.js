const { channel } = require('diagnostics_channel')
const omnipower_normal = require('./omnipower_normal')
const omnipower_igneous = require('./omnipower_igneous')

function shadow_tendrils(type, settings, numberOfHits) {
    const normal = omnipower_normal(type,settings,1);
    const igneous = omnipower_igneous(type,settings,4);
    if (settings['cape'] === 'igneous kal-mej') {
        return igneous[igneous.length-1];
    }
    else {
        return normal[normal.length-1];
    }
}

module.exports = shadow_tendrils;