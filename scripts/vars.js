/* UI Param */
var TCOffset = Core.settings.getBool("mod-time-control-enabled", false) ? 62 : 0;
const BarDist = 70;


var unitsperrow = 10
var blocksperrow = 15

// var mobileWidth = 55;
// var mobileHeight = 55;
// var mobilePad = 5;

var buttonHeight = 50;
var buttonWidth = 50;
var searchWidth = 500;
var iconSize = 42;
var gridPad = 5;
var gridButtonSize = 76;
var BarPad = 2;

var optionButtonWidth = 220

var iconRoom = "   ";

var defaultUnit = UnitTypes.dagger
var defaultBlock = Blocks.coreNucleus
var defaultTeam = Vars.state.rules.waveTeam

var longPress = 30;

var startFolded = false
var instantkill = false

var rebuildPeriod = 0;

module.exports = {
    defaultUnit : defaultUnit,
    defaultBlock : defaultBlock,
    TCOffset : TCOffset,
    unitsperrow : unitsperrow,
    blocksperrow : blocksperrow,
    buttonHeight : buttonHeight,
    buttonWidth : buttonWidth,
    searchWidth : searchWidth,
    iconSize : iconSize,
    BarDist : BarDist,
    optionButtonWidth : optionButtonWidth,
    BarPad : BarPad,
    gridPad : gridPad,
    gridButtonSize : gridButtonSize,
    iconRoom : iconRoom,
    startFolded : startFolded,
    defaultTeam : defaultTeam,
    instantkill : instantkill,
    longPress : longPress,
    rebuildPeriod : rebuildPeriod,
}