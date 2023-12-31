/* UI Param */
var TCOffset = Core.settings.getBool("mod-time-control-enabled", false) ? 62 : 0;

var unitsperrow = 10
var blocksperrow = 15

var mobileWidth = 55;
var mobileHeight = 55;
var mobilePad = 5;
var mobileDist = 85;

var buttonHeight = 50;
var buttonWidth = 50;
var searchWidth = 500;
var iconSize = 42;

var BarPad = 1;
var BarDist = 75;

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
    BarDist : BarDist,
    BarPad : BarPad,
    mobilePad : mobilePad,
    mobileDist : mobileDist,
}