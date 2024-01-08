// TODO: Remote functions COMPLETELY BROKEN
// custom scripts and Icon menu?
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
// total unit count for every team


// alerts/notifs:
// make enabled warnings save their enabled status
// make blocks to warn customizable
// add erikir blocks to lists
// add more options


// remember to use this to find properties/functions
// for (let stat in _){print(stat)}

const vars = require("vars")
const ui = require("ui");
const localF = require("localFunctions");
const remoteF = require("remoteFunctions");


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


/* UI Elements */
var spawndialog = null
var statusdialog = null
var blockdialog = null
var gamedialog = null
var statdialog = null
var bstatdialog = null
var valuedialog = null
var weapondialog = null
var weaponstatdialog = null
var bulletstatdialog = null
var rangedialog = null
var filldialog = null

var spawntable = new Table().bottom().left();
var playertable = new Table().bottom().left();
var viewtable

var statusButton;
var aiButton;

var spawnMenuButton;
var spawnlists = [];
var spawnerButton;
var spawningLabelText;

var placeButton;
var blockButton;

var rulesTable;
var statsTable;
var blockStatsTable;
var weaponTable
var weaponStatsTable
var bulletStatsTable

// color rects for team indication
var bbteamRect
var steamRect
var bteamRect


// tables that need to be regenerated for searching
var poss;
var posb;
var rotb;

// filtering for search
var ufilter = "";
var bfilter = "";
var rfilter = "";
var usfilter = "";
var bsfilter = "";
var wsfilter = "";
var bufilter = "";


/* Remote */
var playername = "";


/* click capture */
var clickEvents = [];
const world = new Vec2();
// handling click events
function click(handler, world){
	clickEvents.push({
		handler: handler,
		world: world
	});
	return clickEvents.length - 1;
};


// functions
function removeWeapon(){
	(Vars.net.client() ? remoteF.removeWeapon : localF.removeWeapon)(unitstat, weaponstat);
}

function addWeapon(weapons){
	(Vars.net.client() ? remoteF.addWeapon : localF.addWeapon)(unitstat, weapons);
}

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
}

function kill() {
	(Vars.net.client() ? remoteF.killRemote : localF.killLocal)(vars.instantkill);
};
function clear() {
	(Vars.net.client() ? remoteF.clearRemote : localF.clearLocal)();
};
function clearbanned() {
	(Vars.net.client() ? remoteF.clearbannedRemote : localF.clearbannedLocal)();
};

function AddtoPlan(build, block){
	Vars.player.unit().addBuild(new BuildPlan(build.x / Vars.tilesize, build.y / Vars.tilesize, build.rotation, block, null), false)
}

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
function currentunit(){
	unitstat = Vars.player.unit().type
	if (statsTable != null){updatestats(usfilter, statsTable, unitstat)};
}

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
  }

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
  }

function hasAmmo(build){
	
	if(build.block instanceof PowerTurret || build.block instanceof PointDefenseTurret || build.block instanceof TractorBeamTurret){
		return build.power.status>0;
	}
	if(build.block instanceof Turret){
		return build.hasAmmo();
	}
	return false;
}


// Update lists
function updatespawnlist(filter, utable){
	if (utable.getCells().size >= 3){
		utable.getCells().get(2).clearElement();
		utable.getCells().remove(2);
	}

	if (poss){
		let to_remove = 3
		for (let i = 0; i < to_remove; i++){
			let idx = utable.getCells().size - 1
			utable.getCells().get(idx).clearElement();
			utable.getCells().remove(idx);
		}
	};

	utable.row()
	spawnlists.push(utable.pane(slist => {
		const units = Vars.content.units();
		units.sort();
		var i = 0;
		units.each(unit => {
			var show = true
			if (filter && filter.trim().length > 0){
				let cfilter = filter.trim().toLowerCase()
	   
				if (!unit.localizedName.toLowerCase().includes(cfilter)){
					show = false
				}
			};
			if (show){
				if (i++ % vars.unitsperrow == 0) {
					slist.row();
				}

				const icon = new TextureRegionDrawable(unit.uiIcon);
				let b = slist.button(icon, () => {
					if (fuseMode) {
						fuser = unit;
						spawningLabelText = spawning.localizedName + " fused with " + fuser.localizedName;
					}else{
						spawning = unit;
						spawningLabelText = spawning.localizedName;
					};
					if (!fuseMode){
						spawnerButton.style.imageUp = icon;
					}
					spawnMenuButton.style.imageUp = icon;
				}).pad(vars.gridPad).size(vars.gridButtonSize);//.tooltip(unit.localizedName);
				let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add(unit.localizedName).style(Styles.outlineLabel)})
				b.get().addListener(tooltip)
			};
		});
	}).growX().top().left());
	utable.row();

	/* Random selection */
	let r = utable.table().center().bottom().get();
	r.defaults().left();
	var rSlider = r.slider(0, maxRand, 0.125, rand, n => {
		rand = n;
		rField.text = n;
	}).get();
	r.add(vars.iconRoom + "Spread: ");
	var rField = r.field("" + rand, text => {
		rand = parseInt(text);
		rSlider.value = rand;
	}).get();
	rField.validator = text => !isNaN(parseInt(text));
	utable.row();
	
	/* Count selection */
	let t = utable.table().center().bottom().get();
	t.defaults().left();
	var cSlider = t.slider(1, maxCount, count, n => {
		count = n;
		cField.text = n;
	}).get();
	
	t.add(vars.iconRoom + "Count: ");
	var cField = t.field("" + count, text => {
		count = parseInt(text);
		cSlider.value = count;
	}).get();
	cField.validator = text => !isNaN(parseInt(text));

	utable.row();

	const u = utable.table().center().bottom().get();
	u.defaults().left();

	u.button("Toggle Mode", Icon.refresh, () => {
		fuseMode = !fuseMode;
		if (fuseMode) {
			spawnerButton.style.imageUp = Icon.refresh;
	 		//spawnerButton.getCells().get(1).get().text = vars.iconRoom + "Fuse";
	 	}else{
			const icon = new TextureRegionDrawable(spawning.uiIcon);
			spawnerButton.style.imageUp = icon;
	 		spawningLabelText = spawning.localizedName;
			// spawnerButton.getCells().get(1).get().text = vars.iconRoom + "Spawn";
		};
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();
	poss = u.button("Set Position", Icon.effect, () => {
		spawndialog.hide();
		expectingPos = "Spawn";
	 	click((screen, world) => {
			expectingPos = false;
	 		// We don't need sub-wu precision + make /js output nicer
	 		spos.set(Math.round(world.x), Math.round(world.y));
			Fx.tapBlock.at(spos.x, spos.y);
	 		poss.getLabel().text = "Set Position\n(" + Math.round(spos.x / Vars.tilesize)
	 			+ ", " + Math.round(spos.y / Vars.tilesize) + ")";
	 			spawndialog.show();
		}, true);
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();
}

function updateblocklist(filter, blockTable){
	if (blockTable.getCells().size >= 3){
		blockTable.getCells().get(2).clearElement();
		blockTable.getCells().remove(2);
	}

	if (posb){
		let to_remove = 1
		for (let i = 0; i < to_remove; i++){
			let idx = blockTable.getCells().size - 1
			blockTable.getCells().get(idx).clearElement();
			blockTable.getCells().remove(idx);
		}
	};

	blockTable.row();
	blockTable.pane(blist => {
		const blocks = Vars.content.blocks();
		blocks.sort();
		let i = 0;
		blocks.each(blo => {
			var show = true
			if (filter && filter.trim().length > 0){
				let cfilter = filter.trim().toLowerCase()
	   
				if (!blo.localizedName.toLowerCase().includes(cfilter)){
					show = false
				}
			};
			if (show){
				if (i++ % vars.blocksperrow == 0) {
					blist.row();
				}

				const icon = new TextureRegionDrawable(blo.uiIcon);
				let b = blist.button(icon, () => {
					block = blo;
					blockButton.style.imageUp = icon;
					placeButton.getCells().first().get().setDrawable(icon);
				}).pad(vars.gridPad).size(vars.gridButtonSize).tooltip(blo.localizedName);
				let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add(blo.localizedName).style(Styles.outlineLabel)})
				b.get().addListener(tooltip)
			}
		});
	}).growX().top().center();
	blockTable.row();
	
	const o = blockTable.table().center().bottom().get();
	o.defaults().left();

	// TODO: copypasted code (global bugs)
	var rotations = [Icon.right, Icon.up, Icon.left, Icon.down]
	rotb = o.button("Rotation", rotations[brot], () => {
		brot++;
		if (brot > rotations.length - 1){
			brot = 0
		};
		rotb.getCells().first().get().setDrawable(rotations[brot]);
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();
	posb = o.button("Set Position", Icon.effect, () => {
		blockdialog.hide();
		expectingPos = "Block";
	 	click((screen, world) => {
			expectingPos = false;
	 		// We don't need sub-wu precision + make /js output nicer
	 		bpos.set(Math.round(world.x), Math.round(world.y));
			Fx.tapBlock.at(bpos.x, bpos.y);
	 		posb.getLabel().text = "Set Position\n(" + Math.round(bpos.x / Vars.tilesize)
	 			+ ", " + Math.round(bpos.y / Vars.tilesize) + ")";
	 			blockdialog.show();
	 	}, true);
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();

	o.button("Delete Block", Icon.cancel, () => {
		spawnblock(true);
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();
};

function traverseStats(filter, slist, set, mode, i){
	for (let stat in set) {
		let setstat = stat
		

		if (Object.prototype.toString.call(set[setstat]) == "[object JavaObject]" && objectsToCheck.includes(setstat)){
			i = traverseStats(filter, slist, set[setstat], mode, i)
		};


		if (filter && filter.trim().length > 0){
			let cfilter = filter.trim().toLowerCase()
   
			if (!stat.toLowerCase().includes(cfilter)){
				continue
			}
		};


		if (Object.prototype.toString.call(set[setstat]) == "[object Boolean]"){
			if (i++ % 3 == 0) {
				slist.row();
			};
			
			let statbutton
			let buttonName = setstat
			if (setstat == "infiniteResources"){ // TODO: hardcode in the name of science
				buttonName = "Sandbox Mode"
				statbutton = gamedialog.buttons.button(buttonName, Icon.cancel, () => {
					let enabled
					if (mode == 0){
						(Vars.net.client() ? remoteF.setRuleRemote : localF.setRuleLocal)(setstat, !Vars.state.rules[setstat]);
						enabled = Vars.state.rules[setstat];
					}else{
						(Vars.net.client() ? remoteF.setStatRemote : localF.setStatLocal)(set, setstat, !set[setstat]);
						enabled = set[setstat];
					};

					if (enabled){
						let icon = new TextureRegionDrawable(Icon.ok).tint(Color.acid)
						statbutton.get().getCells().first().get().setDrawable(icon);
						statbutton.get().getLabel().text = "[acid]" + buttonName
					}else{
						let icon = new TextureRegionDrawable(Icon.cancel).tint(Color.scarlet)
						statbutton.get().getCells().first().get().setDrawable(icon);
						statbutton.get().getLabel().text = "[scarlet]" + buttonName
					}}).width(300);
			}else{
				statbutton = slist.button(buttonName, Icon.cancel, () => {
					let enabled
					if (mode == 0){
						(Vars.net.client() ? remoteF.setRuleRemote : localF.setRuleLocal)(setstat, !Vars.state.rules[setstat]);
						enabled = Vars.state.rules[setstat];
					}else{
						(Vars.net.client() ? remoteF.setStatRemote : localF.setStatLocal)(set, setstat, !set[setstat]);
						enabled = set[setstat];
					};

					if (enabled){
						let icon = new TextureRegionDrawable(Icon.ok).tint(Color.acid)
						statbutton.get().getCells().first().get().setDrawable(icon);
						statbutton.get().getLabel().text = "[acid]" + buttonName
					}else{
						let icon = new TextureRegionDrawable(Icon.cancel).tint(Color.scarlet)
						statbutton.get().getCells().first().get().setDrawable(icon);
						statbutton.get().getLabel().text = "[scarlet]" + buttonName
					}}).pad(vars.gridPad).width(300);
			};

			statbutton.name("boolean")

			if (set[setstat]){
				let icon = new TextureRegionDrawable(Icon.ok).tint(Color.acid)
				statbutton.get().getCells().first().get().setDrawable(icon);
				statbutton.get().getLabel().text = "[acid]" + buttonName
			}else{
				let icon = new TextureRegionDrawable(Icon.cancel).tint(Color.scarlet)
				statbutton.get().getCells().first().get().setDrawable(icon);
				statbutton.get().getLabel().text = "[scarlet]" + buttonName
			};
		
		}else if (Object.prototype.toString.call(set[setstat]) == "[object Number]"){
			if (i++ % 3 == 0) {
				slist.row();
			};
			
			let tool
			let intbutton = slist.button(setstat, () => {
				intbutton.name("number")
				valuedialog = null;
				valuedialog = new BaseDialog("Set Value");
				valuedialog.show();
				valuedialog.addCloseButton();
				valuedialog.buttons.button("Set", Icon.ok, () => {valuedialog.hide()}).width(200).height(60);

				const vd = valuedialog.cont.table().center().bottom().get();
				vd.defaults().left();
				var vField

				if (mode == 0){
					vField = vd.field(Vars.state.rules[setstat], text => {
						tool.clear();
						(Vars.net.client() ? remoteF.setRuleRemote : localF.setRuleLocal)(setstat, parseFloat(text));
						tool.add(text);
					}).get();
				}else{
					vField = vd.field(set[setstat], text => {
						tool.clear();
						(Vars.net.client() ? remoteF.setStatRemote : localF.setStatLocal)(set, setstat, parseFloat(text));
						tool.add(text);
					}).get();

				};

				vField.validator = text => !isNaN(parseFloat(text));
			}).pad(vars.gridPad).width(300);
			let tooltip = new Tooltip(t => {tool = t; t.background(Tex.button).margin(10).add(String(set[setstat])).style(Styles.outlineLabel)})
			intbutton.get().addListener(tooltip)
		};
	};
	return i;
}

function updatestats(filter, table, set) {
	// hardcode
	// 0 = rules
	// 1 = unit
	// 2 = block
	// 3 = weapon
	let mode = 0
	if (set == unitstat) {
		mode = 1
	}else if (set == blockstat) {
		mode = 2
	}else if (set == weaponstat) {
		mode = 3
	}else if (set == bulletstat) {
		mode = 4
	}

	var amount = 2
	var minsize = 3

	if (mode == 1){amount += 1};
	if (mode == 3){amount += 1};
	if (mode == 4){minsize -= 1; amount -= 1};

	if (table.getCells().size >= minsize){
		for (let i = 0; i < amount; i++){
		table.getCells().get(1).clearElement();
		table.getCells().remove(1);
		};
	};
	table.row();

	if (mode == 0){
		table.label(() => "World Rules");
	}else if (mode == 1){
		table.label(() => unitstat.localizedName);
	}else if (mode == 2) {
		table.label(() => blockstat.localizedName);
	}else if (mode == 3){
		table.label(() => weaponstat.name);
	}else if (mode == 4){
		//table.label(() => bulletstat);
	};
	table.row();
	
	table.pane(slist => {
		traverseStats(filter, slist, set, mode, 0)
	}).growX().top().center();
	table.row();
	if (mode == 1){
		const a = table.table().center().bottom().get();
		a.defaults().left();
		a.button("Edit Weapons", Icon.pencil, () => {
			updateweaponslist(weaponTable);
			weapondialog.show();
		}).width(vars.optionButtonWidth).pad(vars.gridPad);

		a.button("Edit Abilities", Icon.effect, () => {
		}).width(vars.optionButtonWidth).pad(vars.gridPad);
	}
	if (mode == 3){
		table.button("Edit Bullet", Icon.pencil, () => {
			updatestats(bufilter, bulletStatsTable, bulletstat);
			bulletstatdialog.show()
		}).width(vars.optionButtonWidth);
	};
};

function updateweaponslist(wtable){
	let weapons = unitstat.weapons
	wtable.clear();
	wtable.pane(wlist => {
		let i = 0
		weapons.each(weapon => {
			if (i++ % vars.unitsperrow == 0) {
				wlist.row();
			}
			const icon = new TextureRegionDrawable(weapon.region);
			// if (weapon.flipSprite){	
			// 	icon.region.flip(true, false)
			// 	//icon.region.width = -icon.region.width
			// }
			let b = wlist.button(icon, () => {
				weaponstat = weapon
				bulletstat = weaponstat.bullet
				updatestats(wsfilter, weaponStatsTable, weaponstat);
				weaponstatdialog.show();
			}).pad(vars.gridPad).size(76);//.tooltip(weapon.name);
			let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add(weapon.name).style(Styles.outlineLabel)})
			b.get().addListener(tooltip)

		});
		
		let b = wlist.button(Icon.add, () => {
			var weapons = []
			var weaponNames = []
			var weaponIcons = []

			const units = Vars.content.units();
			units.sort();
			units.each(unit => {
				let oldweapon = null
				unit.weapons.each(w => {
					let weapon = w.copy()
					if (oldweapon && oldweapon.name == weapon.name && weapon.mirror && oldweapon.mirror){
						weapons.push([oldweapon, weapon])

						weaponNames.push(weapon.name + " (" + unit.localizedName + ")")
						weaponIcons.push(weapon.region)
						oldweapon = null
					}else{
						oldweapon = weapon
					}

					if (!weapon.mirror){
						weapons.push([weapon])

						weaponNames.push(weapon.name + " (" + unit.localizedName + ")")
						weaponIcons.push(weapon.region)
					}
				});
			});

			ui.selectgrid("Add a new weapon", weaponNames, weapons, w => {
				addWeapon(w);
				updateweaponslist(weaponTable);
			}, weaponIcons, vars.unitsperrow, "Search Weapons")
		}).pad(vars.gridPad).size(vars.gridButtonSize);//.tooltip("Add a new weapon");
		let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add("Add a new weapon").style(Styles.outlineLabel)})
		b.get().addListener(tooltip)
	});
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
					rangedialog.show()
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
			gamedialog.show();
		});
		rulesButton.style.up = Tex.buttonSideLeft
		rulesButton.style.over = Tex.buttonSideLeftDown
		rulesButton.style.down = Tex.buttonSideLeftOver

		let uStatButton = ui.createButton(spawntable, spawntableinside, "Edit", Icon.units, "Edit unit stats", Styles.cleari, false, () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};

			statdialog.show();
		});

		uStatButton.style.up = Tex.pane
		uStatButton.style.over = Tex.buttonSelectTrans
		uStatButton.style.down = Core.atlas.getDrawable("sandbox-tools-paneOver")

		let bStatButton = ui.createButton(spawntable, spawntableinside, "Edit", Icon.crafting, "Edit block stats", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};

			bstatdialog.show();
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

			spawndialog.show();
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

			blockdialog.show();
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
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};

			ui.select("Team", Team.all, t => {
				(Vars.net.client() ? remoteF.changeteamRemote : localF.changeteamLocal)(t);
				bbteamRect.tint.set(t.color);
			}, (i, t) => "[#" + t.color + "]" + t, null);
		}, vars.fullIconSize);

		let fillHold = 0
		let fillButton = ui.createButton(playertable, playertableinside, "Fill Core", Icon.commandRally, "Fill/Empty core (hold down for more options)", Styles.defaulti, false, () => {
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
					filldialog.show()
				}
			}
		})

		const miniTable = playertableinside.table().center().bottom().pad(vars.BarPad).get();
		miniTable.defaults().left();

		statusButton = ui.createButton(miniTable,  miniTable.cont, "Apply status effects", new TextureRegionDrawable(Icon.effect), "Apply status effects", Styles.defaulti, false,  () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
				return;
			};
			statusdialog.show();
		}, null, vars.miniButtonCut);
		//statusButton.style.imageUpColor = Color.gold

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

function createStatusDialog(){
	statusdialog = new BaseDialog("Status Menu");
	let statusTable = statusdialog.cont;
	statusTable.label(() => effect.localizedName + (effect.permanent ? " (Permanent effect)" : ""));
	statusTable.row();

	statusTable.pane(elist => {
		const effects = Vars.content.statusEffects();
		var i = 0;
		effects.each(eff => {
			if (eff.name == "none" || eff.localizedName == "invincible"){
				return};

			if (i++ % 5 == 0) {
				elist.row();
			}

			var icon = new TextureRegionDrawable(eff.uiIcon);

			let b = elist.button(icon, () => {
				effect = eff;
				statusButton.style.imageUp = icon;
			}).pad(vars.gridPad).size(vars.gridButtonSize);
			let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add(eff.localizedName).style(Styles.outlineLabel)})
			b.get().addListener(tooltip)
		});
	}).growX().top().center();
	statusTable.row();

	const d = statusTable.table().center().bottom().pad(vars.gridPad).get();
	var dSlider, dField;
	d.defaults().left();
	dSlider = d.slider(0, maxDuration, 0.125, duration, n => {
		duration = n;
		dField.text = n;
	}).get();
	d.add(vars.iconRoom + "Duration: ");
	dField = d.field("" + duration, text => {
		duration = parseInt(text);
		dSlider.value = duration;
	}).get();
	dField.validator = text => !isNaN(parseInt(text));
	statusTable.row();

	statusdialog.addCloseButton();
	statusdialog.buttons.button("Clear Effects", Icon.cancel, clear);//.width(vars.optionButtonWidth).pad(vars.gridPad);

	const o = statusTable.table().center().bottom().pad(vars.gridPad).get();
	o.defaults().left();
	o.button("Apply Effect", Icon.add, apply).width(vars.optionButtonWidth).pad(vars.gridPad);
	let permButton = o.button("Apply Permanently", Icon.save, applyperma).width(300).pad(vars.gridPad);
	permButton.disabled(() => effect.permanent)
	
};

function createSpawnDialog(){
	spawndialog = new BaseDialog("Spawn Menu");
	let spawnTable = spawndialog.cont;
	const i = spawnTable.table().center().top().get();
	i.defaults().left()
	i.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(ssearch);
	}).size(50, 50).get()
	var ssearch = i.field(ufilter, text => {
		ufilter = text;
		updatespawnlist(ufilter, spawnTable)
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	ssearch.setMessageText("Search Units")
	spawnTable.row();

	spawnTable.label(() => spawningLabelText);
	spawningLabelText = spawning.localizedName;
	updatespawnlist("", spawnTable);

	spawndialog.addCloseButton();
	
	spawnerButton = ui.createButton(spawndialog.buttons, null, "Spawn", new TextureRegionDrawable(spawning.uiIcon), "", Styles.defaulti, true, () => {
		spawn();
	}).disabled(() => !Vars.world.passable(spos.x / 8, spos.y / 8)).width(300).get();
	spawnerButton.label(() => vars.iconRoom + "Spawn")

	steamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	steamRect.tint.set(team.color);
	spawndialog.buttons.button("Team", steamRect, vars.iconSize, () => {
	 	ui.select("Team", Team.all, t => {
	 		team = t;
	 		steamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t, null);
	});
};

function createWeaponDialog(){
	weapondialog = new BaseDialog("Weapon Menu");
	weaponTable = weapondialog.cont;
	updateweaponslist(weaponTable);
	weapondialog.addCloseButton();
};

function createWeaponStatDialog(){
	weaponstatdialog = new BaseDialog("Weapon Stat Menu");
	weaponStatsTable = weaponstatdialog.cont;

	const ws = weaponStatsTable.table().center().top().get();
	ws.defaults().left()
	ws.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(wssearch);
	}).size(50, 50).get();
	var wssearch = ws.field(wsfilter, text => {
		wsfilter = text;
		updatestats(wsfilter, weaponStatsTable, weaponstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	wssearch.setMessageText("Search Weapon Stats")
	weaponStatsTable.row();
	updatestats("", weaponStatsTable, weaponstat);	
	weaponstatdialog.addCloseButton();
	weaponstatdialog.buttons.button("Remove Weapon", Icon.cancel, () => {
		removeWeapon();
		updateweaponslist(weaponTable);
		weaponstatdialog.hide()
	}).width(vars.optionButtonWidth);
};

function createBulletStatDialog(){
	bulletstatdialog = new BaseDialog("Bullet Stat Menu");
	bulletStatsTable = bulletstatdialog.cont;

	const bu = bulletStatsTable.table().center().top().get();
	bu.defaults().left()
	bu.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(busearch);
	}).size(50, 50).get();
	var busearch = bu.field(bufilter, text => {
		bufilter = text;
		updatestats(bufilter, bulletStatsTable, bulletstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	busearch.setMessageText("Search Bullet Stats")
	bulletStatsTable.row();
	updatestats("", bulletStatsTable, bulletstat);
	bulletstatdialog.addCloseButton();
}

function createRangeDialog(){
	rangedialog = new BaseDialog("Range Menu");
	let rangedialogTable = rangedialog.cont;
	rangedialogTable.check(vars.iconRoom + "Show Ground", viewGroundRange, () => {
		viewGroundRange = !viewGroundRange
	}).pad(vars.gridPad);
	rangedialogTable.row();

	rangedialogTable.check(vars.iconRoom + "Show Air", viewAirRange, () => {
		viewAirRange = !viewAirRange
	}).pad(vars.gridPad);
	rangedialogTable.row();
	
	rangedialog.addCloseButton();
}

function createFillDialog(refresh){
	if (!refresh){filldialog = new BaseDialog("Fill/Empty Core Menu");filldialog.addCloseButton();}
	let filldialogTable = filldialog.cont;
	if (refresh){
		filldialogTable.clear()
	}

	let emptycheck
	let fillcheck = filldialogTable.check(vars.iconRoom + "Fill Core", fillMode == true, () => {
		fillMode = true
		createFillDialog(true)
	}).pad(vars.gridPad);
	filldialogTable.row();

	emptycheck = filldialogTable.check(vars.iconRoom + "Empty Core", fillMode == false, () => {
		fillMode = false
		createFillDialog(true)
	}).pad(vars.gridPad);
	filldialogTable.row();	
};

function createBlockDialog(){
	blockdialog = new BaseDialog("Block Menu");
	let blockTable = blockdialog.cont;
	const b = blockTable.table().center().top().get();
	b.defaults().left()
	b.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(bsearch);
	}).size(50, 50).get();
	var bsearch = b.field(bufilter, text => {
		bufilter = text;
		updateblocklist(bufilter, blockTable)
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	bsearch.setMessageText("Search Blocks")
	blockTable.row();

	blockTable.label(() => block.localizedName);
	updateblocklist("", blockTable);

	blockdialog.addCloseButton();

	placeButton = blockdialog.buttons.button("Place", new TextureRegionDrawable(block.uiIcon), 42, () => {
		spawnblock(false);
	}).disabled(() => !Vars.world.passable(bpos.x / 8, bpos.y / 8)).width(300).get();

	bteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	bteamRect.tint.set(team.color);
	blockdialog.buttons.button("Team", bteamRect, vars.iconSize, () => {
		ui.select("Team", Team.all, t => {
			team = t;
			bteamRect.tint.set(team.color);
		}, (i, t) => "[#" + t.color + "]" + t, null);
	});
};

function createRulesDialog(updateButtons){
	let r
	if (!updateButtons){
		gamedialog = new BaseDialog("Rules Menu");
		rulesTable = gamedialog.cont;

		r = rulesTable.table().center().top().get();
		r.defaults().left()
		r.button(Icon.zoom, Styles.flati, () => {
			Core.scene.setKeyboardFocus(rsearch);
		}).size(50, 50).get();
	}

	gamedialog.buttons.clear()
	gamedialog.addCloseButton();
	gamedialog.buttons.button("Clear Banned Blocks", Icon.cancel, clearbanned).width(300);
	if (updateButtons){
		return
	}

	var rsearch = r.field(rfilter, text => {
		rfilter = text;
		createRulesDialog(true);
		updatestats(rfilter, rulesTable, Vars.state.rules);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	rsearch.setMessageText("Search Rules")
	rulesTable.row();
	updatestats("", rulesTable, Vars.state.rules);
};

function createUnitStatDialog(){
	statdialog = new BaseDialog("Unit Stat Menu");
	statsTable = statdialog.cont;

	const u = statsTable.table().center().top().get();
	u.defaults().left()
	u.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(ussearch);
	}).size(50, 50).get();
	var ussearch = u.field(usfilter, text => {
		usfilter = text;
		updatestats(usfilter, statsTable, unitstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	ussearch.setMessageText("Search Unit Stats")
	statsTable.row();
	updatestats("", statsTable, unitstat);
	statdialog.addCloseButton();
	
	var icons = []
	var processedUnits = []
	for (var n = 0; n < Vars.content.units().size; n++) {
		icons.push(Vars.content.units().get(n).uiIcon)
		processedUnits.push(Vars.content.units().get(n).localizedName)
	};
	
	let cunit = ui.createButton(statdialog.buttons, null, "Choose Unit", new TextureRegionDrawable(unitstat.uiIcon), "", Styles.defaulti, true, () => {
		ui.selectgrid("Choose Unit", processedUnits, Vars.content.units(), u => {
			unitstat = u;
			var icon = new TextureRegionDrawable(unitstat.uiIcon)
			cunit.style.imageUp = icon
			if (statsTable != null){updatestats(usfilter, statsTable, unitstat)};
		}, icons, vars.unitsperrow, "Search Units");
	}).width(300).get();
	cunit.label(() => vars.iconRoom + "Choose Unit")

	statdialog.buttons.button("Choose Current Unit", Icon.effect, () => {
		currentunit();
		var icon = new TextureRegionDrawable(unitstat.uiIcon)
		cunit.style.imageUp = icon
	}).width(300);
};

function createBlockStatDialog(){
	bstatdialog = new BaseDialog("Block Stat Menu");
	blockStatsTable = bstatdialog.cont;

	const b = blockStatsTable.table().center().top().get();
	b.defaults().left()
	b.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(bsearch);
	}).size(50, 50).get();
	var bsearch = b.field(bsfilter, text => {
		bsfilter = text;
		updatestats(bsfilter, blockStatsTable, blockstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	bsearch.setMessageText("Search Block Stats")
	blockStatsTable.row();
	updatestats("", blockStatsTable, blockstat);
	bstatdialog.addCloseButton();

	var bicons = []
	var processedBlocks = []
	for (var n = 0; n < Vars.content.blocks().size; n++) {
		bicons.push(Vars.content.blocks().get(n).uiIcon)
		processedBlocks.push(Vars.content.blocks().get(n).localizedName)
	};

	let cblock = bstatdialog.buttons.button("Choose Block", new TextureRegionDrawable(blockstat.uiIcon), 42, () => {
		ui.selectgrid("Choose Block", processedBlocks, Vars.content.blocks(), b => {
			blockstat = b;
			cblock.getCells().first().get().setDrawable(new TextureRegionDrawable(blockstat.uiIcon));
			if (blockStatsTable != null){updatestats(bsfilter, blockStatsTable, blockstat)};
		}, bicons, vars.blocksperrow, "Search Blocks");
	}).width(300).get();
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

function createMovementVec(posx, posy, unit){
	return new Vec2().set(new Vec2(posx, posy)).sub(unit).limit(unit.speed())
}

function resetAmmoAI(){
	ammoMode = "Find"
	requestCooldown = 0
	targetBuild = null
	targetAmmoAmount = null
	targetAmmo = null
}

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

	if (!Core.input.justTouched()) {
		return;
	}
	// Position in the mindustry world
	world.set(Core.input.mouseWorld());
	// 0, 0 to w, h
	const pos = Core.input.mouse();
	const hasMouse = Core.scene.hasMouse();

	clickEvents = clickEvents.filter(event => {
		// Mod cancelled the event
		if (!event) return;
		// Clicked over a UI element, try again next time
		if (event.world && hasMouse) return true;

		return event.handler(pos, world, hasMouse);
	});
});

Events.on(EventType.WorldLoadEvent, e => {
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

	if (rulesTable != null){createRulesDialog(true); updatestats(rfilter, rulesTable, Vars.state.rules)};
	bbteamRect.tint.set(Vars.player.team().color);
});

Events.on(EventType.ClientLoadEvent, cons(() => {
	createSettings();
	UpdateSettings()

	// Multiplayer
	playername = Core.settings.getString("name").trim();


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
	createRangeDialog();
	createFillDialog(false);
	createSpawnDialog();
	createWeaponDialog();
	createBlockDialog();
	createStatusDialog();
	createRulesDialog(false);
	createUnitStatDialog();
	createBlockStatDialog();
	createWeaponStatDialog();
	createBulletStatDialog();
	print("Loaded Sandbox Tools!")
}));