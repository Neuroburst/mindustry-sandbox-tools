/* UI Param */
var TCOffset = Core.settings.getBool("mod-time-control-enabled", false) ? 62 : 0;

const unitsperrow = 10
const blocksperrow = 15

var mobileWidth = 52;
var mobileHeight = 52;
var buttonHeight = 50;
var buttonWidth = 50;
var searchWidth = 500;
var iconSize = 42;
var BarHeight = 5; // unused

module.exports = {
    TCOffset : TCOffset,
    unitsperrow : unitsperrow,
    blocksperrow : blocksperrow,
    mobileWidth : mobileWidth,
    mobileHeight : mobileHeight,
    buttonHeight : buttonHeight,
    buttonWidth : buttonWidth,
    searchWidth : searchWidth,
    iconSize : iconSize,
    BarHeight : BarHeight,
}