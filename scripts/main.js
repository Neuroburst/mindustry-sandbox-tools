// TODO: Add custom weapon adder
// TODO: Custom unit abilities
// TODO: Add thingy that lists Vars too! (especially change survival vs attack vs sandbox)
// TODO: Remote functions COMPLETELY BROKEN

// TODO: Search function for stat menus


// remember to use this to find properties/functions
// for (let stat in _){print(stat)}

const vars = require("vars")
const ui = require("ui");
const localF = require("localFunctions");
const remoteF = require("remoteFunctions");


var team = Vars.state.rules.waveTeam;

/* Unit spawning */
var spos = new Vec2(-1, -1);

const maxRand = 10;
const maxCount = 100;
var rand = 2;
var count = 1;

var spawning = UnitTypes.dagger;

var fuseMode = false;
var fuser = UnitTypes.dagger;


/* Blocks */
var bpos = new Vec2(-1, -1);
var brot = 0
var block = Blocks.coreNucleus;


/* Effects */
var effect = Vars.content.statusEffects().get(1);
const maxDuration = 600;
var duration = 30;


/* Stats */
var unitstat = UnitTypes.dagger
var blockstat = Blocks.coreNucleus


/* AI */
var playerAI = null;
const ais = ["None", "MineBuilderAI", "BuilderAI", "RepairAI", "AssemblerAI", "BoostAI", "CargoAI", "CommandAI", "DefenderAI", "FlyingAI", "FlyingFollowAI", "GroundAI", "HugAI", "LogicAI", "MinerAI", "MissileAI", "SuicideAI"]
var mode = "b"
var selectedai = "None";


/* UI Elements */
var spawndialog = null
var statusdialog = null
var blockdialog = null
var gamedialog = null
var statdialog = null
var bstatdialog = null
var valuedialog = null

var spawntable = new Table().bottom().left();
var playertable = new Table().bottom().left();

var statusButton;
var blockButton;
var aiButton;

var spawnMenuButton;
var spawnlists = [];
var spawnerButton;
var spawningLabelText;

var rulesTable;
var statsTable;
var blockStatsTable;

// color rects for team indication
var steamRect
var bteamRect


// tables that need to be regenerated for searching
var r 
var t
var tmode
var poss
var posb
var rotb = 0

// filtering for search
var ufilter = ""
var bfilter = ""


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
function spawn() {
	(Vars.net.client() ? remoteF.spawnRemote : localF.spawnLocal)(spos, count, rand, spawning, team, fuser, fuseMode);
};
function spawnblock() {
	(Vars.net.client() ? remoteF.spawnblockRemote : localF.spawnblockLocal)(bpos, block, team, brot);
};
function apply(perma) {
	if (!perma){perma = false}
	(Vars.net.client() ? remoteF.applyRemote : localF.applyLocal)(effect, duration * 60, perma);
};
function applyperma() {
	apply(true);
};
function kill() {
	(Vars.net.client() ? remoteF.killRemote : localF.killLocal)();
};
function clear() {
	(Vars.net.client() ? remoteF.clearRemote : localF.clearLocal)();
};
function clearbanned() {
	(Vars.net.client() ? remoteF.clearbannedRemote : localF.clearbannedLocal)();
};
function changeAI(value) {
	let selectedai = value;
	if (selectedai == "MineBuilderAI"){
		aiButton.style.imageUp = Icon.hammer
		aiButton.style.imageUpColor = Color.orange
		playerAI = new BuilderAI();

	}else if (selectedai == "BuilderAI"){
		aiButton.style.imageUp = Icon.hammer
		aiButton.style.imageUpColor = Color.royal
		playerAI = new BuilderAI();
	}else if (selectedai == "RepairAI"){
		aiButton.style.imageUp = Icon.modeSurvival
		aiButton.style.imageUpColor = Color.acid
		playerAI = new RepairAI();
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
	if (statsTable != null){updatestats(statsTable, unitstat)};
}


// Update lists
function updatespawnlist(filter, utable){
	if (utable.getCells().size >= 3){
		utable.getCells().get(2).clearElement();
		utable.getCells().remove(2);
	}

	if (r){
		let to_remove = [r, t, tmode, poss]
		for (let remove in to_remove){
			let idx = utable.getCells().size - 1
			//remove.remove()
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
				slist.button(icon, () => {
					if (fuseMode) {
						fuser = unit;
						spawningLabelText = spawning.localizedName + " fused with " + fuser.localizedName;
					}else{
						spawning = unit;
						spawningLabelText = spawning.localizedName;
					};

					spawnMenuButton.style.imageUp = icon;
				}).size(76).tooltip(unit.localizedName);
			};
		});
	}).growX().top().left());
	utable.row();

	/* Random selection */
	r = utable.table().center().bottom().get();
	r.defaults().left();
	var rSlider = r.slider(0, maxRand, 0.125, rand, n => {
		rand = n;
		rField.text = n;
	}).get();
	r.add("Randomness: ");
	var rField = r.field("" + rand, text => {
		rand = parseInt(text);
		rSlider.value = rand;
	}).get();
	rField.validator = text => !isNaN(parseInt(text));
	utable.row();
	
	/* Count selection */
	t = utable.table().center().bottom().get();
	t.defaults().left();
	var cSlider = t.slider(1, maxCount, count, n => {
		count = n;
		cField.text = n;
	}).get();
	
	t.add("Count: ");
	var cField = t.field("" + count, text => {
		count = parseInt(text);
		cSlider.value = count;
	}).get();
	cField.validator = text => !isNaN(parseInt(text));

	utable.row();

	tmode = utable.button("Toggle Mode", Icon.refresh, () => {
		fuseMode = !fuseMode;
		if (fuseMode) {
	 		spawnerButton.get().getLabel().text = "Fuse"
	 		spawnerButton.get().getCells().first().get().setDrawable(Icon.refresh);
	 	}else{
	 		spawningLabelText = spawning.localizedName;
	 		spawnerButton.get().getLabel().text = "Spawn"
	 		spawnerButton.get().getCells().first().get().setDrawable(Icon.commandAttack);
		};
	}).width(200).get();
	utable.row();

	poss = utable.button("Set Position", Icon.effect, () => {
		spawndialog.hide();
	 	click((screen, world) => {
	 		// We don't need sub-wu precision + make /js output nicer
	 		spos.set(Math.round(world.x), Math.round(world.y));
	 		poss.getLabel().text = "Set Position (" + Math.round(spos.x / 8)
	 			+ ", " + Math.round(spos.y / 8) + ")";
	 			spawndialog.show();
		}, true);
	}).width(300).get();
}

function updateblocklist(filter, blockTable){
	if (blockTable.getCells().size >= 3){
		blockTable.getCells().get(2).clearElement();
		blockTable.getCells().remove(2);
	}

	if (posb){
		let to_remove = [posb, rotb]
		for (let remove in to_remove){
			let idx = blockTable.getCells().size - 1
			//remove.remove()
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
				blist.button(icon, () => {
					block = blo;
					blockButton.style.imageUp = icon;
				}).size(76).tooltip(blo.localizedName);
			}
		});
	}).growX().top().center();
	blockTable.row();
	
	let rotations = [Icon.right, Icon.up, Icon.left, Icon.down]
	rotb = blockTable.button("Rotation", rotations[brot], () => {
		brot++;
		if (brot > rotations.length - 1){
			brot = 0
		};
		rotb.getCells().first().get().setDrawable(rotations[brot]);
	}).width(300).get();
	blockTable.row()

	posb = blockTable.button("Set Position", Icon.effect, () => {
		blockdialog.hide();
	 	click((screen, world) => {
	 		// We don't need sub-wu precision + make /js output nicer
	 		bpos.set(Math.round(world.x), Math.round(world.y));
	 		posb.getLabel().text = "Set Position (" + Math.round(bpos.x / 8)
	 			+ ", " + Math.round(bpos.y / 8) + ")";
	 			blockdialog.show();
	 	}, true);
	}).width(300).get();
};

function updatestats(table, set) {
	// hardcode
	// 0 = rules
	// 1 = unit
	// 2 = block
	let mode = 0
	if (set == unitstat) {
		mode = 1
	}else if (set == blockstat) {
		mode = 2
	}
	table.clear();

	if (mode == 0){
		table.label(() => "World Rules");
	}else if (mode == 1){
		table.label(() => unitstat.localizedName);
	}else{
		table.label(() => blockstat.localizedName);
	};
	table.row();
	
	table.pane(slist => {
		let i = 0;
		for (let stat in set) {

			let setstat = stat

			if (Object.prototype.toString.call(set[setstat]) == "[object Boolean]"){
				if (i++ % 3 == 0) {
					slist.row();
				};
				
				
				let statbutton = slist.button(setstat, Icon.cancel, () => {
					// (this section must be synced)
					let enabled
					if (mode == 0){
						(Vars.net.client() ? setRuleRemote : localF.setRuleLocal)(setstat, !Vars.state.rules[setstat]);
						enabled = Vars.state.rules[setstat];
					}else if (mode == 1){
						(Vars.net.client() ? setStatRemote : localF.setStatLocal)(unitstat, setstat, !unitstat[setstat]);
						enabled = unitstat[setstat];
					}else{
						(Vars.net.client() ? setbStatRemote : localF.setStatLocal)(blockstat, setstat, !blockstat[setstat]);
						enabled = blockstat[setstat];
					};

					if (enabled){
						let icon = new TextureRegionDrawable(Icon.ok).tint(Color.acid)
						statbutton.get().getCells().first().get().setDrawable(icon);
						statbutton.get().getLabel().text = "[acid]" + setstat
					}else{
						let icon = new TextureRegionDrawable(Icon.cancel).tint(Color.scarlet)
						statbutton.get().getCells().first().get().setDrawable(icon);
						statbutton.get().getLabel().text = "[scarlet]" + setstat
					};
		
				}).width(300);
				
				statbutton.name("boolean")

				if (set[setstat]){
					let icon = new TextureRegionDrawable(Icon.ok).tint(Color.acid)
					statbutton.get().getCells().first().get().setDrawable(icon);
					statbutton.get().getLabel().text = "[acid]" + setstat
				}else{
					let icon = new TextureRegionDrawable(Icon.cancel).tint(Color.scarlet)
					statbutton.get().getCells().first().get().setDrawable(icon);
					statbutton.get().getLabel().text = "[scarlet]" + setstat
				};
			
			}else if (Object.prototype.toString.call(set[setstat]) == "[object Number]"){
				if (i++ % 3 == 0) {
					slist.row();
				};
				
				let intbutton = slist.button(setstat, () => {
					intbutton.name("number")
					valuedialog = null;
					valuedialog = new BaseDialog("Set Value");
					valuedialog.show();
					valuedialog.addCloseButton();
					valuedialog.buttons.button("Set", Icon.ok, () => {valuedialog.hide()}).width(200).height(60);

					const vd = valuedialog.cont.table().center().bottom().get();
					vd.defaults().left();
					// (this section must be synced)
					if (mode == 0){
						var vField = vd.field(Vars.state.rules[setstat], text => {
							(Vars.net.client() ? setRuleRemote : localF.setRuleLocal)(setstat, parseFloat(text));
						}).get();
						vField.validator = text => !isNaN(parseFloat(text));
					}else if (mode == 1){
						var vField = vd.field(unitstat[setstat], text => {
							(Vars.net.client() ? setStatRemote : localF.setStatLocal)(unitstat, setstat, parseFloat(text));
						}).get();
						vField.validator = text => !isNaN(parseFloat(text));

					}else {
						var vField = vd.field(blockstat[setstat], text => {
							(Vars.net.client() ? setbStatRemote : localF.setStatLocal)(blockstat, setstat, parseFloat(text));
						}).get();
						vField.validator = text => !isNaN(parseFloat(text));
					};
					
				}).width(300);
			};
	
		};
	}).growX().top().center();
};


// UI Creation
function createFolderButtons(spawntableinside, playertableinside){
	ui.createButton(spawntable, spawntableinside, "Game", Icon.menu, "Change game rules", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};
		gamedialog.show();
	});
	ui.createButton(spawntable, spawntableinside, "Edit", Icon.units, "Edit unit stats", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		statdialog.show();
	});
	ui.createButton(spawntable, spawntableinside, "Edit", Icon.pencil, "Edit block stats", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		bstatdialog.show();
	});

	let spawnicon = new TextureRegionDrawable(spawning.uiIcon);
	spawnMenuButton = ui.createButton(spawntable, spawntableinside, "Spawn Menu", spawnicon, "Spawn units", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		spawndialog.show();
	});
	let blockicon = new TextureRegionDrawable(block.uiIcon);
	blockButton = ui.createButton(spawntable, spawntableinside, "Block Menu", blockicon, "Place blocks", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		blockdialog.show();
	});

	var bbteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	bbteamRect.tint.set(Vars.player.team().color);
	ui.createButton(playertable, playertableinside, "Change Team", bbteamRect, "Change player team", Styles.cleari, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		ui.select("Team", Team.all, t => {
			(Vars.net.client() ? changeteamRemote : localF.changeteamLocal)(t);
			bbteamRect.tint.set(t.color);
		}, (i, t) => "[#" + t.color + "]" + t, null);
	});
	aiButton = ui.createButton(playertable, playertableinside, "Change AI", Icon.logic, "Change player AI", Styles.defaulti, () => {
		ui.select("Choose player AI", ais, value => {selectedai = changeAI(value)}, ais, null);
	});
	statusButton = ui.createButton(playertable, playertableinside, "Apply status effects", Icon.effect, "Apply status effects", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};
		statusdialog.show();
	});
	ui.createButton(playertable, playertableinside, "Become invincible", Icon.modeSurvival, "Become invincible", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};
		Fx.blastExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/8);
		(Vars.net.client() ? healRemote : localF.healLocal)(true);
	});
	ui.createButton(playertable, playertableinside, "Heal to full health", Icon.add, "Heal to full health", Styles.defaulti, () => {
	if (Vars.state.rules.sector) {
		Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
		return;
	};
		Fx.greenBomb.at(Vars.player.getX(), Vars.player.getY(), 0);
		(Vars.net.client() ? healRemote : localF.healLocal)(false);
	});
	let kbutton = ui.createButton(playertable, playertableinside, "Kill the current unit", Icon.commandAttack, "Kill the player", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};
		
		Fx.dynamicExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/16);
		kill();
	});
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
			
			if (eff.name == "none") return;

			if (i++ % 5 == 0) {
				elist.row();
			}

			const icon = new TextureRegionDrawable(eff.uiIcon);
			elist.button(icon, () => {
				effect = eff;
				statusButton.style.imageUp = icon;
			}).size(84).tooltip(eff.localizedName);
		});
	}).growX().top().center();
	statusTable.row();

	const d = statusTable.table().center().bottom().get();
	var dSlider, dField;
	d.defaults().left();
	dSlider = d.slider(0, maxDuration, 0.125, duration, n => {
		duration = n;
		dField.text = n;
	}).get();
	d.add("Duration: ");
	dField = d.field("" + duration, text => {
		duration = parseInt(text);
		dSlider.value = duration;
	}).get();
	dField.validator = text => !isNaN(parseInt(text));
	statusTable.row();

	statusdialog.addCloseButton();
	statusdialog.buttons.button("Apply Effect", Icon.add, apply);
	statusdialog.buttons.button("Apply Permanently", Icon.save, applyperma);
	statusdialog.buttons.button("Clear Effects", Icon.cancel, clear)
};

function createSpawnDialog(){
	spawndialog = new BaseDialog("Spawn Menu");
	let spawnTable = spawndialog.cont;
	const i = spawnTable.table().center().top().get();
	i.defaults().left()
	let ssearch = i.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(ssearch);
	}).size(50, 50).get()
	i.field(ufilter, text => {
		ufilter = text;
		updatespawnlist(ufilter, spawnTable)
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	spawnTable.row();

	spawnTable.label(() => spawningLabelText);
	spawningLabelText = spawning.localizedName;
	updatespawnlist("", spawnTable);

	spawndialog.addCloseButton();

	spawnerButton = spawndialog.buttons.button("Spawn", Icon.commandAttack, spawn)
		.disabled(() => !Vars.world.passable(spos.x / 8, spos.y / 8));

	steamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	steamRect.tint.set(team.color);
	spawndialog.buttons.button("Team", steamRect, vars.iconSize, () => {
	 	ui.select("Team", Team.all, t => {
	 		team = t;
	 		steamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t, null);
	});
};

function createBlockDialog(){
	blockdialog = new BaseDialog("Block Menu");
	let blockTable = blockdialog.cont;
	const b = blockTable.table().center().top().get();
	b.defaults().left()
	let bsearch = b.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(bsearch);
	}).size(50, 50).get();
	b.field(bfilter, text => {
		bfilter = text;
		updateblocklist(bfilter, blockTable)
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	blockTable.row();

	blockTable.label(() => block.localizedName);
	updateblocklist("", blockTable);

	blockdialog.addCloseButton();

	blockdialog.buttons.button("Place", Icon.add, spawnblock)
	.disabled(() => !Vars.world.passable(bpos.x / 8, bpos.y / 8));

	bteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	bteamRect.tint.set(team.color);
	blockdialog.buttons.button("Team", bteamRect, vars.iconSize, () => {
		ui.select("Team", Team.all, t => {
			team = t;
			bteamRect.tint.set(team.color);
		}, (i, t) => "[#" + t.color + "]" + t, null);
	});
};

function createRulesDialog(){
	gamedialog = new BaseDialog("Game Menu");
	rulesTable = gamedialog.cont;
	updatestats(rulesTable, Vars.state.rules);
	gamedialog.addCloseButton();
	gamedialog.buttons.button("Clear Banned Blocks", Icon.cancel, clearbanned).width(300);
};

function createUnitStatDialog(){
	statdialog = new BaseDialog("Unit Stat Menu");
	statsTable = statdialog.cont;
	updatestats(statsTable, UnitTypes.dagger);
	statdialog.addCloseButton();
	
	var icons = []
	for (var n = 0; n < Vars.content.units().size; n++) {
		icons.push(Vars.content.units().get(n).uiIcon)
	};
	let cunit = statdialog.buttons.button("Choose Unit", Icon.add, () => {
		ui.selectgrid("Choose Unit", Vars.content.units(), u => {
			unitstat = u;
			cunit.getCells().first().get().setDrawable(new TextureRegionDrawable(unitstat.uiIcon));
			if (statsTable != null){updatestats(statsTable, unitstat)};
		}, null, icons, vars.unitsperrow);
	}).get();
	statdialog.buttons.button("Choose Current Unit", Icon.effect, currentunit).width(300);
};

function createBlockStatDialog(){
	bstatdialog = new BaseDialog("Block Stat Menu");
	blockStatsTable = bstatdialog.cont;
	updatestats(blockStatsTable, Blocks.coreNucleus);
	bstatdialog.addCloseButton();
	var bicons = []
	for (var n = 0; n < Vars.content.blocks().size; n++) {
		bicons.push(Vars.content.blocks().get(n).uiIcon)
	};
	bstatdialog.buttons.button("Choose Block", Icon.add, () => {
		ui.selectgrid("Choose Block", Vars.content.blocks(), b => {
			blockstat = b;
			if (blockStatsTable != null){updatestats(blockStatsTable, blockstat)};
		}, null, bicons, vars.blocksperrow);
	});
};


// Events
Events.run(Trigger.update, () => {
	if (steamRect && bteamRect){
		steamRect.tint.set(team.color);
		bteamRect.tint.set(team.color);
	};

	// Automatically switch between Miner and Builder AI
	if (playerAI){
		if (selectedai == "MineBuilderAI" && Vars.player.unit().type.mineSpeed > 0 && Vars.player.unit().plans.size == 0){
			if (mode == "b"){
				playerAI = new MinerAI()
				mode = "m"
			};
		}else{
			if (mode == "m"){
				playerAI = new BuilderAI()
				mode = "b"
			};
		};
	};
	if (playerAI && Vars.state.paused == false){playerAI.unit(Vars.player.unit()); playerAI.updateUnit()}; // Apply AI


	if (Vars.ui.hudGroup){
		spawntable.visible = Vars.ui.hudGroup.children.get(3).visible
		playertable.visible = Vars.ui.hudGroup.children.get(3).visible
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
	// Update tables
	if (rulesTable != null){updatestats(rulesTable, Vars.state.rules)};
	if (statsTable != null){updatestats(statsTable, unitstat)};
	if (blockStatsTable != null){updatestats(blockStatsTable, blockstat)};
});

Events.on(EventType.ClientLoadEvent, cons(() => {
	// Multiplayer
	playername = Core.settings.getString("name").trim();


	// Add the tables for the buttons
	Vars.ui.hudGroup.addChild(spawntable); 
	Vars.ui.hudGroup.addChild(playertable);

	/* create folders */
	var spawntableinside;
	spawntable.table(Styles.black5, cons(t => {
	t.background(Tex.buttonEdge3);
	spawntableinside = t;
	})).padBottom(vars.BarDist + vars.TCOffset).padLeft(0).name("SpawnTable");

	var playertableinside;
	playertable.table(Styles.black5, cons(t => {
		t.background(Tex.buttonEdge3);
		playertableinside = t;
	})).padBottom(0 + vars.TCOffset).padLeft(0);

	// create buttons in folders
	createFolderButtons(spawntableinside, playertableinside);

	// create dialogs
	createSpawnDialog();
	createBlockDialog();
	createStatusDialog();
	createRulesDialog();
	createUnitStatDialog();
	createBlockStatDialog();
	print("Loaded Sandbox Tools!")
}));