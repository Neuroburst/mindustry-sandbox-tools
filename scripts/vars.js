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
var gridPad = 5;
var gridButtonSize = 76;
var BarPad = 2;
var BarDist = 74;

var iconRoom = "   ";

var defaultUnit = UnitTypes.dagger
var defaultBlock = Blocks.coreNucleus

module.exports = {
    defaultUnit : defaultUnit,
    defaultBlock : defaultBlock,
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
    gridPad : gridPad,
    gridButtonSize : gridButtonSize,
    iconRoom : iconRoom,
}