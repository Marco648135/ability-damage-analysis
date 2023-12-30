const { channel } = require('diagnostics_channel')
const smoke_tendrils_1 = require('./smoke_tendrils_1')
const smoke_tendrils_2 = require('./smoke_tendrils_2')
const smoke_tendrils_3 = require('./smoke_tendrils_3')
const smoke_tendrils_4 = require('./smoke_tendrils_4')

function shadow_tendrils(type, settings, numberOfHits) {
    const hitOne = shadow_tendrils_hit(type,settings,1);
    const hitTwo = shadow_tendrils_hit(type,settings,1);
    const hitThree = shadow_tendrils_hit(type,settings,1);
    const hitFour = shadow_tendrils_hit(type,settings,1);
    return  [hitOne[hitOne.length-1] + hitTwo[hitTwo.length-1] + hitThree[hitThree.length-1] + hitFour[hitFour.length-1]];
}

module.exports = shadow_tendrils;