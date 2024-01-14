// General Parameters

/* UI Param */
var TCOffset = Core.settings.getBool("mod-time-control-enabled", false) ? 62 : 0;
const BarDist = 104; // 70
var buttonHeight = 55;
var buttonWidth = 55;
var miniButtonCut = 30
var iconSize = 48;
var fullIconSize = 30;
var BarPad = 2;

var unitsperrow = 10
var teamsperrow = 8
var blocksperrow = 15

var searchWidth = 500;
var gridPad = 5;
var gridButtonSize = 76;


var optionButtonWidth = 220

var iconRoom = "   ";

var defaultUnit = UnitTypes.dagger
var defaultBlock = Blocks.coreNucleus
var defaultTeam = Vars.state.rules.waveTeam

var longPress = 30;

var startFolded = false
var instantkill = false

var rebuildPeriod = 0;

var rangeFillTransparency = 0.02
var rangeBorderTransparency = 0.5


module.exports = {
    defaultUnit : defaultUnit,
    defaultBlock : defaultBlock,
    TCOffset : TCOffset,
    unitsperrow : unitsperrow,
    blocksperrow : blocksperrow,
    teamsperrow : teamsperrow,
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
    rangeFillTransparency : rangeFillTransparency,
    rangeBorderTransparency : rangeBorderTransparency,
    miniButtonCut : miniButtonCut,
    fullIconSize : fullIconSize,
}