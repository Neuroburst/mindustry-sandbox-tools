// TODO: Remote functions COMPLETELY BROKEN
// custom scripts?
// Change between planets and weather (like testing ulities java)


// auto-ammo ai for turrets on servers // depositing resources in ANY AI on a server is also broked

// Stats to add:
// Block.requirements
// Block.buildVisibility
// Unit.aiController
// Unit.controller
// Unit.abilities // TODO: Custom unit "abilities" (check js guide schematic)
// Unit.immunities
// change stats of >items<
// set wave
// change team rules



// global power net
// compensate for range boost in turrets

// alerts/notifs:
// make enabled warnings save their enabled status
// make blocks to warn customizable
// add erikir blocks to lists
// add more options

// better team selection menu (grid?)
// total unit count for every team



// remember to use this to find properties/functions
// for (let stat in _){print(stat)}

const vars = require("sandbox-tools/vars");
const ui = require("sandbox-tools/ui");
const diag = require("sandbox-tools/dialogs");
const localF = require("sandbox-tools/localFunctions");
const remoteF = require("sandbox-tools/remoteFunctions");


var team = vars.defaultTeam;

/* Range Viewing */
var viewTurretRange = false
var viewUnitRange = false

let viewAirRange = true
let viewGroundRange = true

/* Unit spawning */
var spos = new Vec2(-100, -100);
var expectingPos = false
var shover = false

const maxRand = 10;
const maxCount = 100;
var rand = 2;
var count = 1;

var spawning = vars.defaultUnit;

var fuseMode = false;
var fuser = vars.defaultUnit;


/* Blocks */
var bpos = new Vec2(-100, -100);
var brot = 0
var block = vars.defaultBlock;
var bhover = false


/* Effects */
var effect = Vars.content.statusEffects().get(1);
const maxDuration = 600;
var duration = 30;


/* Stats */
var objectsToCheck = ["shoot"]

var unitstat = vars.defaultUnit
var blockstat = vars.defaultBlock
var weaponstat = vars.defaultUnit.weapons.get(0)
var bulletstat = weaponstat.bullet

/* Upgrades */
const upgrades = ["Custom", "Conveyors", "Conduits", "Drills", "Copper Walls", "Titanium Walls", "Thorium Walls", "Beryllium Walls", "Tungsten Walls", "Reinforced Surge Walls"]

/* fill */
var fillMode = true

/* AI */
var playerAI = null;
// TODO: (hardcoded)
const ais = ["None", "MineBuilderAI", "BuilderAI", "RepairAI", "AutoAmmoAI", "AssemblerAI", "BoostAI", "CargoAI", "CommandAI", "DefenderAI", "FlyingAI", "FlyingFollowAI", "GroundAI", "HugAI", "LogicAI", "MinerAI", "MissileAI", "SuicideAI"]
var buildMode = "b"

var ammoMode = "Find"
var requestCooldown = 0
var targetAmmo
var targetBuild
var targetAmmoAmount

var selectedai = "None";


var Bottomfolded = false
var Topfolded = false

/* Warnings */
var teamData = {} // Data for each team and their accomplishments
var allWarnings = false
var unitWarn = false // when the enemy produces units
var blockWarn = false // when the enemy builds a certain block for the first time
var blocksToWarn = [Blocks.spectre, Blocks.foreshadow, Blocks.cyclone, Blocks.swarmer, Blocks.meltdown,
	Blocks.additiveReconstructor, Blocks.multiplicativeReconstructor, Blocks.exponentialReconstructor, Blocks.tetrativeReconstructor] // TODO: add Erekir blocks too/customization

var resourcesToWarn = [Blocks.graphitePress, Blocks.siliconSmelter, Blocks.kiln, Blocks.plastaniumCompressor, Blocks.phaseWeaver, Blocks.surgeSmelter, Blocks.pyratiteMixer, Blocks.blastMixer] // TODO: add Erekir blocks too

var resourcesWarn = false // when the enemy first produces a resource
var baseWarn = false // when the base is under attack, and at what position or new units are sent to attack
var powerWarn = false // show alerts for power failure or lacking production


// filtering for search
var ufilter = "";
var rfilter = "";
var usfilter = "";
var bsfilter = "";
var wsfilter = "";


// color rects for team indication
var bbteamRect
var steamRect
var bteamRect


var spawntable = new Table().bottom().left();
var playertable = new Table().bottom().left();
var viewtable

var aiButton
var spawnMenuButton;
var blockButton;

// direct actions
function removeWeapon(){
	(Vars.net.client() ? remoteF.removeWeapon : localF.removeWeapon)(unitstat, weaponstat);
};
function addWeapon(weapons){
	(Vars.net.client() ? remoteF.addWeapon : localF.addWeapon)(unitstat, weapons);
};
function spawn() {
	(Vars.net.client() ? remoteF.spawnRemote : localF.spawnLocal)(spos, count, rand, spawning, team, fuser, fuseMode);
};
function spawnblock(del) {
	if (del){
		(Vars.net.client() ? remoteF.spawnblockRemote : localF.spawnblockLocal)(bpos, null, team, 0);
	}else{
		(Vars.net.client() ? remoteF.spawnblockRemote : localF.spawnblockLocal)(bpos, block, team, brot);
	}
	
};
function apply(perma) {
	if (!perma){perma = false}
	(Vars.net.client() ? remoteF.applyRemote : localF.applyLocal)(effect, duration * 60, perma);
};
function applyperma() {
	apply(true);
};
function fillEmptyCore() {
	(Vars.net.client() ? remoteF.fillEmptyCoreRemote : localF.fillEmptyCoreLocal)(Vars.player.unit().core(), fillMode);
};
function kill() {
	(Vars.net.client() ? remoteF.killRemote : localF.killLocal)(vars.instantkill);
};
function clear() {
	(Vars.net.client() ? remoteF.clearRemote : localF.clearLocal)();
};
function clearbanned() {
	(Vars.net.client() ? remoteF.clearbannedRemote : localF.clearbannedLocal)();
};


// Other Util Functions
function AddtoPlan(build, block){
	Vars.player.unit().addBuild(new BuildPlan(build.x / Vars.tilesize, build.y / Vars.tilesize, build.rotation, block, null), false)
};
function Upgrade(type){
	var builds = Vars.player.team().data().buildings

	if (type == "Custom"){
		var bicons = []
		var processedBlocks = []
		for (var n = 0; n < Vars.content.blocks().size; n++) {
			bicons.push(Vars.content.blocks().get(n).uiIcon)
			processedBlocks.push(Vars.content.blocks().get(n).localizedName)
		};

		ui.selectgrid("Select Target Block", processedBlocks, Vars.content.blocks(), b => {
			let target = b
			ui.selectgrid("Select Resulting Block", processedBlocks, Vars.content.blocks(), b2 => {
				let result = b2

				builds.forEach(build => {
					if (build.block == target)
					AddtoPlan(build, result)
				})
			}, bicons, vars.blocksperrow, "Search Blocks")
		}, bicons, vars.blocksperrow, "Search Blocks")
	}

	builds.forEach(build => {		
		if (type == "Copper Walls" && build.block.name.startsWith("copper")){
			if (build.block.name.endsWith("arge")){
				AddtoPlan(build, Blocks.titaniumWallLarge)
			}else{
				AddtoPlan(build, Blocks.titaniumWall)
			}
		} else if (type == "Titanium Walls" && build.block.name.startsWith("titanium")){
			if (build.block.name.endsWith("arge")){
				AddtoPlan(build, Blocks.thoriumWallLarge)
			}else{
				AddtoPlan(build, Blocks.thoriumWall)
			}
		} else if (type == "Thorium Walls" && build.block.name.startsWith("thorium")){
			if (build.block.name.endsWith("arge")){
				AddtoPlan(build, Blocks.surgeWallLarge)
			}else{
				AddtoPlan(build, Blocks.surgeWall)
			}
		} else if (type == "Beryllium Walls" && build.block.name.startsWith("beryllium")){
			if (build.block.name.endsWith("arge")){
				AddtoPlan(build, Blocks.tungstenWallLarge)
			}else{
				AddtoPlan(build, Blocks.tungstenWall)
			}
		} else if (type == "Tungsten Walls" && build.block.name.startsWith("tungsten")){
			if (build.block.name.endsWith("arge")){
				AddtoPlan(build, Blocks.reinforcedSurgeWallLarge)
			}else{
				AddtoPlan(build, Blocks.reinforcedSurgeWall)
			}
		} else if (type == "Reinforced Surge Walls" && build.block.name.startsWith("reinforced-surge")){
			if (build.block.name.endsWith("arge")){
				AddtoPlan(build, Blocks.carbideWallLarge)
			}else{
				AddtoPlan(build, Blocks.carbideWall)
			}
		}

		if (type == "Conveyors" && build.block == Blocks.conveyor){
			AddtoPlan(build, Blocks.titaniumConveyor)
		} else if (type == "Conduits" && build.block == Blocks.conduit){
			AddtoPlan(build, Blocks.pulseConduit)
		} else if (type == "Drills" && build.block == Blocks.mechanicalDrill){
			AddtoPlan(build, Blocks.pneumaticDrill)
		}
	})
}
function changeAI(value) {
	let selectedai = value;
	if (selectedai == "MineBuilderAI"){
		aiButton.style.imageUp = Icon.production
		aiButton.style.imageUpColor = Color.orange
		playerAI = new BuilderAI();
		playerAI.rebuildPeriod = vars.rebuildPeriod;
	}else if (selectedai == "BuilderAI"){
		aiButton.style.imageUp = Icon.hammer
		aiButton.style.imageUpColor = Color.royal
		playerAI = new BuilderAI();
		playerAI.rebuildPeriod = vars.rebuildPeriod;
	}else if (selectedai == "RepairAI"){
		aiButton.style.imageUp = Icon.modeSurvival
		aiButton.style.imageUpColor = Color.acid
		playerAI = new RepairAI();
	}else if (selectedai == "AutoAmmoAI"){
		aiButton.style.imageUp = Icon.turret
		aiButton.style.imageUpColor = Color.scarlet
		resetAmmoAI()
	}else if (selectedai == "None"){
		aiButton.style.imageUp = Icon.logic
		aiButton.style.imageUpColor = Color.white
		playerAI = null
	} else {
		aiButton.style.imageUp = Icon.add
		aiButton.style.imageUpColor = Color.scarlet
		playerAI = eval("new " + selectedai + "()");
	}
    return selectedai
};

function drawPosUnit() {
	let x = 0
	let y = 0
    if (expectingPos == "Spawn" && !Core.scene.hasMouse()) {
      x = Core.input.mouseWorldX();
      y = Core.input.mouseWorldY();
      if (Vars.net.client()) {
        x = Mathf.floor(x);
        y = Mathf.floor(y);
      } 
    } else if (shover) {
      x = spos.x;
      y = spos.y;
    } else {
      return;
    } 
    Draw.z(120.0);
    Lines.stroke(1.0, team.color);
    if (rand > 0)
      Lines.circle(x, y, rand * 8.0); 
    Draw.rect(Icon.effect.getRegion(), x, y, 8.0, 8.0);
};
function drawPosBlock() {
    let x = 0
	let y = 0
    let size = (block.size * 8);
    let offset = ((1 - block.size % 2) * 8) / 2.0;
	if (expectingPos == "Block" && !Core.scene.hasMouse()) {
      x = (World.toTile(Core.input.mouseWorldX()) * Vars.tilesize);
      y = (World.toTile(Core.input.mouseWorldY()) * Vars.tilesize);
    } else if (bhover) {
	x = Math.round(bpos.x / Vars.tilesize) * Vars.tilesize
	y = Math.round(bpos.y / Vars.tilesize) * Vars.tilesize
    } else {
      return;
    } 
    Draw.z(120.0);

    Lines.stroke(1.0, team.color);
    Lines.rect(x - size / 2.0 + offset, y - size / 2.0 + offset, size, size);
	// TODO: global variable bugs, so copypasta is needed
	var rotations = [Icon.right, Icon.up, Icon.left, Icon.down]
    Draw.rect(rotations[brot].getRegion(), x, y, 8.0, 8.0);
};
function hasAmmo(build){
	
	if(build.block instanceof PowerTurret || build.block instanceof PointDefenseTurret || build.block instanceof TractorBeamTurret){
		return build.power.status>0;
	}
	if(build.block instanceof Turret){
		return build.hasAmmo();
	}
	return false;
};
function createMovementVec(posx, posy, unit){
	return new Vec2().set(new Vec2(posx, posy)).sub(unit).limit(unit.speed())
};
function resetAmmoAI(){
	ammoMode = "Find"
	requestCooldown = 0
	targetBuild = null
	targetAmmoAmount = null
	targetAmmo = null
};

// UI Creation
function createFolderButtons(spawntableinside, playertableinside, viewtableinside, cheats, spawns, view, viewFold, playerFold){
	if (viewFold == null){
		viewFold = true
	}
	if (playerFold == null){
		playerFold = true
	}

	if (view){
		let rangeHold = 0;
		let tRange = ui.createButton(viewtable, viewtableinside, "ShowTurretRange", Icon.turret, "Show turret range (hold down for more options)", Styles.defaulti, false, () => {
			if(rangeHold > vars.longPress){return}
			viewTurretRange = !viewTurretRange
			if (viewTurretRange){
				tRange.style.imageUpColor = Pal.accent
			}else{
				tRange.style.imageUpColor = Color.white
			}

		});
		tRange.style.up = Tex.buttonSideLeft
		tRange.style.over = Tex.buttonSideLeftDown
		tRange.style.down = Tex.buttonSideLeftOver

		tRange.update(() => {
			if(tRange.isPressed()){				
				rangeHold += Core.graphics.getDeltaTime() * 60;
				if(rangeHold > vars.longPress){
					rangeHold = 0
					diag.rangedialog().show()
				}
			}
		})

		let uRange = ui.createButton(viewtable, viewtableinside, "ShowUnitRange", Icon.units, "Show unit range", Styles.defaulti, false, () => {
			viewUnitRange = !viewUnitRange
			if (viewUnitRange){
				uRange.style.imageUpColor = Pal.accent
			}else{
				uRange.style.imageUpColor = Color.white
			}
		});

		uRange.style.up = Tex.buttonSideRight
		uRange.style.over = Tex.buttonSideRightDown
		uRange.style.down = Tex.buttonSideRightOver

		let warnButtons = []
		let warnings
		let setupWarnings = function func(){
			allWarnings = !allWarnings
			for (let i in warnButtons){
				let button = warnButtons[i]
				button.disabled = !allWarnings
			}
			if (allWarnings){
				if (Vars.ui.hudfrag){Vars.ui.hudfrag.showToast(Icon.ok, "Warnings Enabled (You must enable other warnings for this to do anything)")}
				warnings.style.imageUpColor = Pal.accent
			}else{
				if (Vars.ui.hudfrag){Vars.ui.hudfrag.showToast(Icon.cancel, "Warnings Disabled")}
				warnings.style.imageUpColor = Color.white
			}}
		warnings = ui.createButton(viewtable, viewtableinside, "Warnings", Icon.warning, "Show alerts for enemy development", Styles.defaulti, false, setupWarnings);

		warnings.style.up = Tex.buttonSideLeft
		warnings.style.over = Tex.buttonSideLeftDown
		warnings.style.down = Tex.buttonSideLeftOver

		let uwarn = ui.createButton(viewtable, viewtableinside, "Unit Warnings", Icon.units, "Show alerts for enemy unit creation", Styles.defaulti, false, () => {
			unitWarn = !unitWarn
			if (unitWarn){
				uwarn.style.imageUpColor = Pal.accent
			}else{
				uwarn.style.imageUpColor = Color.white
			}
		});
		warnButtons.push(uwarn)
		uwarn.style.up = Tex.pane
		uwarn.style.over = Tex.buttonSelectTrans
		uwarn.style.down = Core.atlas.getDrawable("sandbox-tools-paneOver")

		let bwarn = ui.createButton(viewtable, viewtableinside, "Block Warnings", Icon.crafting, "Show alerts for enemy blocks", Styles.defaulti, false, () => {
			blockWarn = !blockWarn
			if (blockWarn){
				bwarn.style.imageUpColor = Pal.accent
			}else{
				bwarn.style.imageUpColor = Color.white
			}
		});
		warnButtons.push(bwarn)
		bwarn.style.up = Tex.pane
		bwarn.style.over = Tex.buttonSelectTrans
		bwarn.style.down = Core.atlas.getDrawable("sandbox-tools-paneOver")

		let rwarn = ui.createButton(viewtable, viewtableinside, "Resource Warnings", Icon.book, "Show alerts for enemy resource production", Styles.defaulti, false, () => {
			resourcesWarn = !resourcesWarn
			if (resourcesWarn){
				rwarn.style.imageUpColor = Pal.accent
			}else{
				rwarn.style.imageUpColor = Color.white
			}
		});
		warnButtons.push(rwarn)
		rwarn.style.up = Tex.pane
		rwarn.style.over = Tex.buttonSelectTrans
		rwarn.style.down = Core.atlas.getDrawable("sandbox-tools-paneOver")

		let bawarn = ui.createButton(viewtable, viewtableinside, "Base Warnings", Icon.modeAttack, "Show alerts for when your base is under attack", Styles.defaulti, false, () => {
			baseWarn = !baseWarn
			if (baseWarn){
				bawarn.style.imageUpColor = Pal.accent
			}else{
				bawarn.style.imageUpColor = Color.white
			}
		});
		warnButtons.push(bawarn)
		bawarn.style.up = Tex.pane
		bawarn.style.over = Tex.buttonSelectTrans
		bawarn.style.down = Core.atlas.getDrawable("sandbox-tools-paneOver")

		let powerwarn = ui.createButton(viewtable, viewtableinside, "Power Warnings", Icon.power, "Show alerts for power status", Styles.defaulti, false, () => {
			powerWarn = !powerWarn
			if (powerWarn){
				powerwarn.style.imageUpColor = Pal.accent
			}else{
				powerwarn.style.imageUpColor = Color.white
			}
		});
		warnButtons.push(powerwarn)
		powerwarn.style.up = Tex.buttonSideRight
		powerwarn.style.over = Tex.buttonSideRightDown
		powerwarn.style.down = Tex.buttonSideRightOver
		allWarnings = !allWarnings // flip it
		setupWarnings()

		
		ui.createButton(viewtable, viewtableinside, "Unit Count", Icon.chartBar, "View total unit count", Styles.defaulti, false, () => {
			let processedNames = []
			let processedIcons = []
			for (let team in Team.all){
				processedNames.push(team.name)
				let rect = extend(TextureRegionDrawable, Tex.whiteui, {});
				rect.tint = team.color
				processedIcons.push(rect)
			}
			ui.selectgrid("Team", processedNames, Team.all, t => {
				
			}, processedIcons, vars.teamsperrow, "Search Teams");
		});
	}

	if (viewFold){
		ui.createButton(viewtable, viewtableinside, "FoldViewShelf", (Topfolded ? Icon.leftOpen : Icon.rightOpen), (Topfolded ? "Unfold the shelf" : "Fold the shelf"), Styles.defaulti, false, () => {
			Topfolded = !Topfolded
			viewtableinside.clear()
			createFolderButtons(spawntableinside, playertableinside, viewtableinside, false, false, !Topfolded, null, false)
		});
	}


	if (spawns){
		let rulesButton = ui.createButton(spawntable, spawntableinside, "Game", Icon.menu, "Change game rules", Styles.defaulti, false, () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};
			diag.gamedialog().show();
		});
		rulesButton.style.up = Tex.buttonSideLeft
		rulesButton.style.over = Tex.buttonSideLeftDown
		rulesButton.style.down = Tex.buttonSideLeftOver

		let uStatButton = ui.createButton(spawntable, spawntableinside, "Edit", Icon.units, "Edit unit stats", Styles.cleari, false, () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};

			diag.statdialog().show();
		});

		uStatButton.style.up = Tex.pane
		uStatButton.style.over = Tex.buttonSelectTrans
		uStatButton.style.down = Core.atlas.getDrawable("sandbox-tools-paneOver")

		let bStatButton = ui.createButton(spawntable, spawntableinside, "Edit", Icon.crafting, "Edit block stats", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};

			diag.bstatdialog().show();
		});
		bStatButton.style.up = Tex.buttonSideRight
		bStatButton.style.over = Tex.buttonSideRightDown
		bStatButton.style.down = Tex.buttonSideRightOver

		let spawnicon = new TextureRegionDrawable(spawning.uiIcon);
		spawnMenuButton = ui.createButton(spawntable, spawntableinside, "Spawn Menu", spawnicon, "Spawn units", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};

			diag.spawndialog().show();
		}, vars.fullIconSize);
		spawnMenuButton.style.up = Tex.buttonSideLeft
		spawnMenuButton.style.over = Tex.buttonSideLeftDown
		spawnMenuButton.style.down = Tex.buttonSideLeftOver

		spawnMenuButton.hovered(() => {shover = true});
		spawnMenuButton.exited(() => {shover = false});

		let blockicon = new TextureRegionDrawable(block.uiIcon);
		blockButton = ui.createButton(spawntable, spawntableinside, "Block Menu", blockicon, "Place blocks", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};

			diag.blockdialog().show();
		}, vars.fullIconSize);
		blockButton.style.up = Tex.buttonSideRight
		blockButton.style.over = Tex.buttonSideRightDown
		blockButton.style.down = Tex.buttonSideRightOver

		blockButton.hovered(() => {bhover = true});
		blockButton.exited(() => {bhover = false});
	}

	if (playerFold){
		ui.createButton(playertable, playertableinside, "Fold Shelf", (Bottomfolded ? Icon.upOpen : Icon.downOpen), (Bottomfolded ? "Unfold the shelf" : "Fold the shelf"), Styles.defaulti, false,  () => {
			Bottomfolded = !Bottomfolded

			spawntable.visible = !Bottomfolded
			playertableinside.clear()
			createFolderButtons(spawntableinside, playertableinside, viewtableinside, !Bottomfolded, false, false, false)
			
		});

		aiButton = ui.createButton(playertable, playertableinside, "Change AI", Icon.logic, "Change player AI", Styles.defaulti, false, () => {
			ui.select("Choose player AI", ais, value => {selectedai = changeAI(value)}, ais, null);
		});

		let upgradeButton = ui.createButton(playertable, playertableinside, "Upgrade", Icon.up, "Upgrade blocks", Styles.defaulti, false, () => {
			ui.select("Choose upgrade type", upgrades, value => {Upgrade(value)}, upgrades, null);
		});
		//upgradeButton.style.imageUpColor = Color.orange
	}

	if (cheats){
		bbteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
		bbteamRect.tint.set(Vars.player.team().color);
		ui.createButton(playertable, playertableinside, "Change Team", bbteamRect, "Change player team", Styles.defaulti, false, () => {
			// if (Vars.state.rules.sector) {
			// 	Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			// 	return;
			// };

			ui.select("Team", Team.all, t => {
				(Vars.net.client() ? remoteF.changeteamRemote : localF.changeteamLocal)(t);
				bbteamRect.tint.set(t.color);
			}, (i, t) => "[#" + t.color + "]" + t, null);
		}, vars.fullIconSize);

		let fillHold = 0
		let fillButton = ui.createButton(playertable, playertableinside, "Fill Core", Icon.commandRally, "Fill/Empty core (hold down for more options)", Styles.defaulti, false, () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};
			if (fillHold > vars.longPress){return};
			fillEmptyCore()
		});

		fillButton.update(() => {
			if (fillMode){
				fillButton.style.imageUp = Icon.commandRally
			}else{
				fillButton.style.imageUp = Icon.eraser
			}

			if(fillButton.isPressed()){				
				fillHold += Core.graphics.getDeltaTime() * 60;
				if(fillHold > vars.longPress){
					fillHold = 0
					diag.filldialog().show()
				}
			}
		})

		const miniTable = playertableinside.table().center().bottom().pad(vars.BarPad).get();
		miniTable.defaults().left();

		ui.createButton(miniTable,  miniTable.cont, "Apply status effects", new TextureRegionDrawable(Icon.effect), "Apply status effects", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};
			diag.statusdialog().show();
		}, null, vars.miniButtonCut);

		let invButton = ui.createButton(miniTable,  miniTable.cont, "Become invincible", new TextureRegionDrawable(Icon.modeSurvival), "Become invincible", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};
			Fx.blastExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/8);
			(Vars.net.client() ? remoteF.healRemote : localF.healLocal)(true);
		}, null, vars.miniButtonCut);
		//invButton.style.imageUpColor = Color.royal
		miniTable.row()
		let healButton = ui.createButton(miniTable, miniTable.cont, "Heal to full health", new TextureRegionDrawable(Icon.add), "Heal to full health", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};
				Fx.greenBomb.at(Vars.player.getX(), Vars.player.getY(), 0);
				(Vars.net.client() ? remoteF.healRemote : localF.healLocal)(false);
		}, null, vars.miniButtonCut);
		//healButton.style.imageUpColor = Color.acid
		
		let kHold = 0;
		let killButton = ui.createButton(miniTable, miniTable.cont, "Kill the current unit", new TextureRegionDrawable(Icon.commandAttack), "Kill the player (hold down to spam)", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};
			if(kHold > vars.longPress){return}
			Fx.dynamicExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/16);
			kill();
		}, null, vars.miniButtonCut);
		//killButton.style.imageUpColor = Color.scarlet
		killButton.update(() => {
			if(killButton.isPressed()){
				if (Vars.state.rules.sector) {
					Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
					return;
				};
				
				kHold += Core.graphics.getDeltaTime() * 60;
				if(kHold > vars.longPress){
					kill();
				}
			}
		})
	};
};

function createSettings(){
	const dialog = new BaseDialog("Sandbox Tools Settings");
    dialog.addCloseButton();
    dialog.cont.center().pane(p => {
        p.defaults().height(36).growX();
        
		function addTeamSetting(name, def){
			let teamRect = extend(TextureRegionDrawable, Tex.whiteui, {});

			let color = Team[Core.settings.getString(name, def.name)].color

			teamRect.tint.set(color);
            p.button(vars.iconRoom + name, teamRect, 40, () => {
				ui.select("Team", Team.all, t => {
					Core.settings.put(name, t.name);
					UpdateSettings()
					teamRect.tint.set(t.color);
				}, (i, t) => "[#" + t.color + "]" + t, null);
				
            }).size(250, 60).pad(vars.gridPad).tooltip("The default team for spawning blocks and units");
            p.row();
        }

        function addBoolSetting(name, def, tool){
            p.check(vars.iconRoom + name, Core.settings.getBool(name, def), () => {
                Core.settings.put(name, !Core.settings.getBool(name, def));
				UpdateSettings()
            }).pad(vars.gridPad).tooltip(tool);
            p.row();
        }

		function addIntSetting(name, min, step, def, max, tool){
			let t = p.table().center().bottom().pad(vars.gridPad).get();
			t.defaults().left();

			t.add(vars.iconRoom + name);
			var tSlider = t.slider(min, max, step, Core.settings.getString(name, def), value => {
				Core.settings.put(name, String(value));
				UpdateSettings();
				tField.text = parseFloat(value);
			
			}).pad(vars.gridPad).tooltip(tool).get();

			var tField = t.field(Core.settings.getString(name, def), text => {
				Core.settings.put(name, String(text));
				UpdateSettings();
			 	tSlider.value = parseFloat(text);
			}).pad(vars.gridPad).get();
			tField.validator = text => !isNaN(parseFloat(text));
            p.row();
        }

		function addLabel(text){
			p.label(() => text).width(100).padTop(50).center()
			p.row();
		}
        // function addOptionSetting(name, def){
        //     p.button(name, () => {
		// 		bbteamRect.tint.set(Vars.player.team().color);
		// 		ui.select("Team", Team.all, t => {
		// 			//Core.settings.put(name, !Core.settings.getBool(name, def));
		// 			UpdateSettings()
		// 			bbteamRect.tint.set(t.color);
		// 		}, (i, t) => "[#" + t.color + "]" + t, null);
				
        //     }).width(200).pad(vars.gridPad);
        //     p.row();
        // }
        addLabel("- - -  UI  - - -")
		addBoolSetting("Start Folded", false, "Whether or not to make the bottom Sandbox Tools shelf folded by default (Restart required to take effect)")
		addIntSetting("Button Padding", 0, 0.25, 2, 20, "The Padding between the buttons in the Sandbox Tools shelf (Restart required to take effect)")
		addIntSetting("Units per row", 1, 1, 10, 30, "The amounts of units shown per row")
		addIntSetting("Blocks per row", 0, 1, 15, 30, "The amount of blocks shown per row")
		addIntSetting("Long press Time", 1, 1, 30, 120, "The amount of time for a long press")

		addLabel("- - -  Other  - - -")
		addBoolSetting("Instant Kill", false, "Instantly Die.")
		addIntSetting("Range fill Transparency", 0.001, 0.001, 0.02, 1.0, "The transparency of the fill")
		addIntSetting("Range border Transparency", 0.001, 0.001, 0.5, 1.0, "The transparency of the border")
		addIntSetting("Rebuild Time", 0, 0.1, 0, 120, "The amount of time between building blocks in Builder AI mode (in seconds)")
		addTeamSetting("Default Team", Team.sharded)

		p.button("Icon Library", Icon.menu, 40, () => {
			var iconNames = []
			var icons = []
			var i = 0
			for (let iconName in Icon){
				if (Object.prototype.toString.call(Icon[iconName]) == "[object Function]" || Object.prototype.toString.call(Icon[iconName]) == "[object Undefined]" || iconName == "icons"){
					continue
				}
				iconNames.push(iconName)
				icons.push(Icon[iconName])
				
				i += 1
			}
			ui.selectgrid("Icons", iconNames, iconNames, i => {}, icons, vars.blocksperrow, "Search Icons")
		}).size(250, 60).pad(vars.gridPad).tooltip("You're welcome in advance");
		
    }).growY().growX();
    
    Vars.ui.settings.shown(() => {
        Vars.ui.settings.children.get(1).children.get(0).children.get(0).row();
        Vars.ui.settings.children.get(1).children.get(0).children.get(0).button("Sandbox Tools", Icon.crafting, Styles.cleart, () => {
            dialog.show();
		});
	});
};

function UpdateSettings(){
    vars.startFolded = Core.settings.getBool("Start Folded");
	vars.BarPad = parseFloat(Core.settings.getString("Button Padding"));
	vars.unitsperrow = parseFloat(Core.settings.getString("Units per row"));
	vars.blocksperrow = parseFloat(Core.settings.getString("Blocks per row"));
	vars.defaultTeam = Team[Core.settings.getString("Default Team")]
	vars.rebuildPeriod = parseFloat(Core.settings.getString("Rebuild Time"));

	vars.instantkill = Core.settings.getBool("Instant Kill");
	vars.longPress = parseInt(Core.settings.getString("Long press Time"));
	vars.rangeFillTransparency = parseFloat(Core.settings.getString("Range fill Transparency"));
	vars.rangeBorderTransparency = parseFloat(Core.settings.getString("Range border Transparency"));

	team = vars.defaultTeam;
}

// Events
Events.run(Trigger.draw, () => {
	if (Vars.state.isGame()){
		drawPosUnit();
		drawPosBlock();

		var camera = Core.camera;
		if(viewTurretRange){
			Draw.draw(Layer.darkness+0.01, run(()=>{
				for (let t in Team.all){
					let team = Team.all[t]
					var builds = team.data().buildings
					builds.forEach(build => {
						if(!build.block.flags.contains(BlockFlag.turret)){
							return}
						
						let inView = (Math.abs(build.x - camera.position.x) - build.block.range < camera.width / 2 && Math.abs(build.y - camera.position.y) - build.block.range < camera.height / 2)
						if(((viewAirRange&&build.block.targetAir)||(viewGroundRange&&build.block.targetGround)) && inView){
							if (!hasAmmo(build)){
								Draw.color(Pal.gray,0.01);
								Fill.circle(build.x, build.y, build.block.range);
								Draw.color(Pal.gray, vars.rangeBorderTransparency);
								Lines.circle(build.x, build.y, build.block.range);
							}else{
								Draw.color(build.team.color,vars.rangeFillTransparency);
								Fill.circle(build.x, build.y, build.block.range);
								Draw.color(build.team.color,vars.rangeBorderTransparency);
								Lines.circle(build.x, build.y, build.block.range);
							}
						}
					});
				};
			}));
		};
		if (viewUnitRange){
			Draw.draw(Layer.darkness+0.02, run(()=>{
				for (let t in Team.all){
					let team = Team.all[t]
					var units = team.data().units
					units.forEach(unit => {
						let range = unit.type.maxRange

						let inView = (Math.abs(unit.x - camera.position.x) - range < camera.width / 2 && Math.abs(unit.y - camera.position.y) - range < camera.height / 2)
						if(inView){
							Draw.color(unit.team.color,vars.rangeFillTransparency);
							Fill.circle(unit.x, unit.y, range);
							Draw.color(unit.team.color,vars.rangeBorderTransparency);
							Lines.circle(unit.x, unit.y, range);
						}
					})
				}
			}));
		};
	};
	Draw.reset();
})

Events.on(UnitCreateEvent, event => {
	let unit = event.unit
	if (unitWarn && unit.team != Vars.player.team() && !teamData[unit.team]["units"].includes(unit.type.name)){
		Vars.ui.hudfrag.showToast(new TextureRegionDrawable(unit.type.uiIcon), "Team " + unit.team.name + " has produced a " + unit.type.localizedName + " for the first time!");
		teamData[unit.team]["units"].push(unit.type.name)
	}
	
})

Events.on(BlockBuildEndEvent, event => {
	let build = event.tile.build
	if (build && build.team != Vars.player.team() && build.block){
		let block = build.block
		if (blockWarn && blocksToWarn.includes(block) && !teamData[build.team]["blocks"].includes(block.name)){
			Vars.ui.hudfrag.showToast(new TextureRegionDrawable(block.uiIcon), "Team " + build.team.name + " has built a " + block.localizedName + " for the first time!");
			teamData[build.team]["blocks"].push(block.name)
		}
		if (resourcesWarn && resourcesToWarn.includes(block) && !teamData[build.team]["resources"].includes(block.outputItem.item)){
			Vars.ui.hudfrag.showToast(new TextureRegionDrawable(block.outputItem.item.uiIcon), "Team " + build.team.name + " started " + block.outputItem.item.localizedName + " production!");
			teamData[build.team]["resources"].push(block.outputItem.item)
		}
	}
	
})

Events.run(Trigger.update, () => {
	if (steamRect && bteamRect){
		steamRect.tint.set(team.color);
		bteamRect.tint.set(team.color);
	};

	if (Vars.state.isGame()){
		// Automatically switch between Miner and Builder AI
		if (playerAI && selectedai == "MineBuilderAI"){
			if (Vars.player.unit().type.mineSpeed > 0 && Vars.player.unit().plans.size == 0){
				if (buildMode == "b"){
					playerAI = new MinerAI()
					buildMode = "m"
				};
			}else{
				if (buildMode == "m"){
					playerAI = new BuilderAI();
					playerAI.rebuildPeriod = vars.rebuildPeriod;
					buildMode = "b"
				};
			};
		};
		if (selectedai == "AutoAmmoAI"){
			var pUnit = Vars.player.unit()
			var core = pUnit.core()
			var closeCore = pUnit.closestCore()
			if (pUnit && core && closeCore && !Vars.net.client()){
				if (ammoMode == "Find"){
					var turrets = []
					Vars.player.team().data().buildings.each(b=>{if(b.block.flags.contains(BlockFlag.turret)){turrets.push(b)}})
					for (let i in turrets){
						let build = turrets[i]
						let turret = build.block

						if(!turret instanceof ItemTurret){
							continue
						}

						if (!build.hasAmmo()){
							let ammoTypes = turret.ammoTypes

							let possibleAmmo = []

							ammoTypes.each(a=>{
								if (core.items.has(a) && core.items.get(a) >= pUnit.type.itemCapacity){
									possibleAmmo.push(a)
								}

							})
							if (possibleAmmo.length > 0){
								targetAmmo = possibleAmmo[possibleAmmo.length - 1]
								targetAmmoAmount = Math.floor(turret.maxAmmo / ammoTypes.get(targetAmmo).ammoMultiplier)
								targetBuild = build
								ammoMode = "Collect"
								print(String(targetAmmoAmount) + " " + targetAmmo.name + " is needed")
								print("Found Turret, Proceeding to collect resources from core")
								break
							}
						}
					}
				} else if (ammoMode == "Collect"){
					if (pUnit.within(closeCore, Vars.itemTransferRange)){
						if (requestCooldown <= 0){
							if (pUnit.stack.amount > 0 && pUnit.stack.item != targetAmmo){
								print("Dropping excess materials")
								Call.transferItemTo(pUnit, pUnit.stack.item, pUnit.stack.amount, pUnit.x, pUnit.y, closeCore); // clean unit inventory
								pUnit.clearItem();
							}else{
								print("Requesting " + String(targetAmmoAmount) + " " + targetAmmo.name)
								Call.requestItem(Vars.player, closeCore, targetAmmo, targetAmmoAmount)
							}
							requestCooldown = 60
						}else{
							requestCooldown -= 1
						}
						
					}else{
						pUnit.movePref(createMovementVec(closeCore.x, closeCore.y, pUnit));
					}
					if (pUnit.stack.item == targetAmmo && pUnit.stack.amount >= targetAmmoAmount){
						print("Heading towards turret to deposit to")
						requestCooldown = 0
						ammoMode = "Deposit"
					}
				} else if (ammoMode == "Deposit"){
					if (pUnit.within(targetBuild, Vars.itemTransferRange)){
						if (Vars.net.client){ // deposit to turret
							InputHandler.transferItemTo(pUnit, targetAmmo, targetAmmoAmount, pUnit.x, pUnit.y, targetBuild);
						}else{
							Call.transferItemTo(pUnit, targetAmmo, targetAmmoAmount, pUnit.x, pUnit.y, targetBuild); 
						}
					}else{
						pUnit.movePref(createMovementVec(targetBuild.x, targetBuild.y, pUnit));
					}
				}
				if (targetBuild && (targetBuild.hasAmmo() || !Vars.player.team().data().buildings.contains(targetBuild))){
					print("reset")
					resetAmmoAI()

				}
			}
		}
		
		if (playerAI && Vars.state.paused == false){playerAI.unit(Vars.player.unit()); playerAI.updateUnit()}; // Apply AI
	}

	if (Vars.ui.hudGroup){
		if (!Bottomfolded){
			spawntable.visible = Vars.ui.hudGroup.children.get(4).visible
		}
		playertable.visible = Vars.ui.hudGroup.children.get(4).visible
		viewtable.visible = Vars.ui.hudGroup.children.get(4).visible
	}
});

Events.on(EventType.WorldLoadEvent, e => {
	// reset ai and warnings
	teamData = {}
	for (let i in Team.all){
		let newTeamData = {"units" : [], "blocks": [], "resources": []}
		teamData[Team.all[i]] = newTeamData
	}

	UpdateSettings()
	viewtable.marginRight((Vars.ui.hudGroup.children.get(3).visible ? 146 : 0));
	
	playerAI = null
	selectedai = "None"
	changeAI("None")
	bbteamRect.tint.set(Vars.player.team().color);
});

Events.on(EventType.ClientLoadEvent, cons(() => {
	Core.settings.put("console", true);
	Vars.renderer.minZoom = 0.667;
	Vars.renderer.maxZoom = 24.0;

	createSettings();
	UpdateSettings()

	// Multiplayer
	//playername = Core.settings.getString("name").trim();


	// Add the tables for the buttons
	Vars.ui.hudGroup.addChild(spawntable); 
	Vars.ui.hudGroup.addChild(playertable);

	var viewtableinside
	/* create folders */
	Vars.ui.hudGroup.fill(cons(t => {
		viewtable = t
		
		viewtable.table(Styles.black5, cons(t => {
			t.background(Tex.buttonSideLeft);
			viewtableinside = t;
			})).padBottom(0).padRight(0).name("ViewTable");
		// fill the space if the minimap is gone
		viewtable.top().right().marginRight((Vars.ui.hudGroup.children.get(3).visible ? 146 : 0));
	}));

	var spawntableinside;
	spawntable.table(Styles.black5, cons(t => {
	t.background(Tex.buttonEdge3);
	spawntableinside = t;
	})).padBottom(vars.BarDist + (vars.BarPad*2) + vars.TCOffset).padLeft(0).name("SpawnTable");

	var playertableinside;
	playertable.table(Styles.black5, cons(t => {
		t.background(Tex.buttonEdge3);
		playertableinside = t;
	})).padBottom(0 + vars.TCOffset).padLeft(0).name("PlayerTable");

	// create buttons in folders
	createFolderButtons(spawntableinside, playertableinside, viewtableinside, true, true, true);

	if (vars.startFolded){
		Bottomfolded = true
		spawntable.visible = false
		viewtableinside.clear()
		playertableinside.clear()
		createFolderButtons(spawntableinside, playertableinside, viewtableinside, false, false, true)
	}

	// create dialogs
	if (diag.createDialogs){
		diag.setengine(this)
		diag.createDialogs();
	}
	print("Loaded Sandbox Tools!")
}));