// TODO: Add custom weapon adder
// TODO: Custom unit abilities
// TODO: Add thingy that lists Vars too! (especially change survival vs attack vs sandbox)
// TODO: Remote functions COMPLETELY BROKEN

// TODO: Search function for stat menus
// TODO: Custom block rotation
// TODO: separate into multiple scripts and cleanup code


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


/* Effects */
var effect = Vars.content.statusEffects().get(1);
const maxDuration = 600;
var duration = 30;


/* Blocks */
var bpos = new Vec2(-1, -1);
var block = Blocks.coreNucleus;


/* Stats */
var unitstat = UnitTypes.dagger
var blockstat = Blocks.coreNucleus


/* AI */
var playerAI = null;
const ais = ["None", "MBuilderAI", "BuilderAI", "RepairAI", "AssemblerAI", "BoostAI", "CargoAI", "CommandAI", "DefenderAI", "FlyingAI", "FlyingFollowAI", "GroundAI", "HugAI", "LogicAI", "MinerAI", "MissileAI", "SuicideAI"]
var mode = "b"
var selectedai = "None";


/* UI Elements */
var spawndialog = null
var effectdialog = null
var blockdialog = null
var gamedialog = null
var statdialog = null
var bstatdialog = null
var valuedialog = null

var spawntable = new Table().bottom().left();
var playertable = new Table().bottom().left();

var sbutton;
var ebutton;
var bbutton;
var aibutton;

var spawnlists = [];
var spawnerButton;
var spawningLabelText;

var stable;
var gtable;
var bstable;

var rulelist;
var statlist;
var bstatlist;

// tables that need to be regenerated for searching
var r 
var t
var tmode
var poss
var posb

// color rects for team indication
var teamRect
var bteamRect

// filtering for search
var bfilter = ""
var ufilter = ""

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
function definefindp() {
	Call.sendChatMessage("/js findp = name => Groups.player.find(e=>Strings.stripColors(e.name)==name)");
};
function spawn() {
	(Vars.net.client() ? remoteF.spawnRemote : localF.spawnLocal)(spos, count, rand, spawning, team, fuser, fuseMode);
};
function spawnblock() {
	(Vars.net.client() ? remoteF.spawnblockRemote : localF.spawnblockLocal)(bpos, block, team);
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
	if (selectedai == "MBuilderAI"){
		aibutton.style.imageUp = Icon.hammer
		aibutton.style.imageUpColor = Color.orange
		playerAI = new BuilderAI();

	}else if (selectedai == "BuilderAI"){
		aibutton.style.imageUp = Icon.hammer
		aibutton.style.imageUpColor = Color.royal
		playerAI = new BuilderAI();
	}else if (selectedai == "RepairAI"){
		aibutton.style.imageUp = Icon.modeSurvival
		aibutton.style.imageUpColor = Color.acid
		playerAI = new RepairAI();
	}else if (selectedai == "None"){
		aibutton.style.imageUp = Icon.logic
		aibutton.style.imageUpColor = Color.white
		playerAI = null
	} else {
		aibutton.style.imageUp = Icon.add
		aibutton.style.imageUpColor = Color.scarlet
		playerAI = eval("new " + selectedai + "()");
	}
    return selectedai
};
function currentunit(){
	unitstat = Vars.player.unit().type
	if (stable != null){updatestats(stable, statlist, unitstat)};
}


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

					sbutton.style.imageUp = icon;
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

	poss = utable.button("Set Position", Icon.down, () => {
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

function updateblocklist(filter, btable){
	if (btable.getCells().size >= 3){
		btable.getCells().get(2).clearElement();
		btable.getCells().remove(2);
	}

	if (posb){
		let idx = btable.getCells().size - 1

		btable.getCells().get(idx).clearElement();
		btable.getCells().remove(idx);
	};

	btable.row();
	btable.pane(blist => {
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
					bbutton.style.imageUp = icon;
				}).size(76).tooltip(blo.localizedName);
			}
		});
	}).growX().top().center();
	btable.row();

	posb = btable.button("Set Position", Icon.down, () => {
		blockdialog.hide();
	 	click((screen, world) => {
	 		// We don't need sub-wu precision + make /js output nicer
	 		bpos.set(Math.round(world.x), Math.round(world.y));
	 		posb.getLabel().text = "Place at " + Math.round(bpos.x / 8)
	 			+ ", " + Math.round(bpos.y / 8);
	 			blockdialog.show();
	 	}, true);
	}).width(300).get();
};

function updatestats(table, list, set) {
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
		if (mode == 0){
			rulelist = slist;
		}else if (mode == 1){
			statlist = slist;
		}else{
			bstatlist = slist;
		};

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


Events.run(Trigger.update, () => {
	if (teamRect && bteamRect){
		teamRect.tint.set(team.color);
		bteamRect.tint.set(team.color);
	};
	
	if (playerAI){
		if (selectedai == "MBuilderAI" && Vars.player.unit().type.mineSpeed > 0 && Vars.player.unit().plans.size == 0){
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
	
	if (playerAI && Vars.state.paused == false){playerAI.unit(Vars.player.unit()); playerAI.updateUnit()};

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
	if (gtable != null){updatestats(gtable, rulelist, Vars.state.rules)};
	if (stable != null){updatestats(stable, statlist, unitstat)};
	if (bstable != null){updatestats(bstable, bstatlist, blockstat)};
});

Events.on(EventType.ClientLoadEvent, cons(() => {
	// Setup UI
	if(Vars.mobile){
		vars.buttonHeight = vars.mobileHeight;
		vars.buttonWidth = vars.mobileWidth;
	};
	playername = Core.settings.getString("name").trim();

	Vars.ui.hudGroup.addChild(spawntable); 
	Vars.ui.hudGroup.addChild(playertable);

	/* create folders */
	var spawntableinside;
	spawntable.table(Styles.black5, cons(t2 => {
	t2.background(Tex.buttonEdge3);
	spawntableinside = t2;
	})).padBottom(80 + vars.TCOffset).padLeft(0).name("SpawnTable");

	var playertableinside;
	playertable.table(Styles.black5, cons(t => {
		t.background(Tex.buttonEdge3);
		playertableinside = t;
	})).padBottom(0 + vars.TCOffset).padLeft(0);
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
	sbutton = ui.createButton(spawntable, spawntableinside, "Spawn Menu", spawnicon, "Spawn units", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		spawndialog.show();
	});
	
	let blockicon = new TextureRegionDrawable(block.uiIcon);
	bbutton = ui.createButton(spawntable, spawntableinside, "Block Menu", blockicon, "Place blocks", Styles.defaulti, () => {
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

	aibutton = ui.createButton(playertable, playertableinside, "Change AI", Icon.logic, "Change player AI", Styles.defaulti, () => {
		ui.select("Choose player AI", ais, value => {selectedai = changeAI(value)}, ais, null);
	});

	ebutton = ui.createButton(playertable, playertableinside, "Apply status effects", Icon.effect, "Apply status effects", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
	 		Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
	 		return;
	 	};
	 	effectdialog.show();
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
	spawndialog = new BaseDialog("Spawn Menu");
	effectdialog = new BaseDialog("Effect Menu");
	blockdialog = new BaseDialog("Block Menu");
	gamedialog = new BaseDialog("Game Menu");
	statdialog = new BaseDialog("Unit Stat Menu");
	bstatdialog = new BaseDialog("Block Stat Menu");

	const table = spawndialog.cont;
	const etable = effectdialog.cont;
	const btable = blockdialog.cont;

	stable = statdialog.cont;
	bstable = bstatdialog.cont;
	gtable = gamedialog.cont;

	/* Name */
	etable.label(() => effect.localizedName + (effect.permanent ? " (Permanent effect)" : ""));
	etable.row();

	/* Selection */
	const i = table.table().center().top().get();
	i.defaults().left()
	let ssearch = i.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(ssearch);
	}).size(vars.buttonWidth, vars.buttonHeight).get()
	i.field(ufilter, text => {
		ufilter = text;
		updatespawnlist(ufilter, table)
	}).padBottom(4).growX().size(vars.searchWidth, vars.buttonHeight).tooltip("Search").get();
	table.row();

	table.label(() => spawningLabelText);
	spawningLabelText = spawning.localizedName;
	updatespawnlist("", table)

	etable.pane(elist => {
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
				ebutton.style.imageUp = icon;
			}).size(84).tooltip(eff.localizedName);
		});
	}).growX().top().center();
	etable.row();

	const b = btable.table().center().top().get();
	b.defaults().left()
	let bsearch = b.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(bsearch);
	}).size(vars.buttonWidth, vars.buttonHeight).get();
	b.field(bfilter, text => {
		bfilter = text;
		updateblocklist(bfilter, btable)
	}).padBottom(4).growX().size(vars.searchWidth, vars.buttonHeight).tooltip("Search").get();
	btable.row();

	btable.label(() => block.localizedName);
	updateblocklist("", btable)

	updatestats(gtable, rulelist, Vars.state.rules);
	gtable.row();

	updatestats(stable, statlist, UnitTypes.dagger);
	stable.row();

	updatestats(bstable, bstatlist, Blocks.coreNucleus);
	bstable.row();

	const d = etable.table().center().bottom().get();
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
	etable.row();
	btable.row();

	/* Buttons */
	spawndialog.addCloseButton();
	effectdialog.addCloseButton();
	blockdialog.addCloseButton();
	gamedialog.addCloseButton();
	statdialog.addCloseButton();
	bstatdialog.addCloseButton();

	const icon = new TextureRegionDrawable(unitstat.uiIcon);
	
	var icons = []
	for (var n = 0; n < Vars.content.units().size; n++) {
		icons.push(Vars.content.units().get(n).uiIcon)
	};

	statdialog.buttons.button("Choose Unit", Icon.add, () => {
		ui.selectgrid("Choose Unit", Vars.content.units(), u => {
			unitstat = u;
			if (stable != null){updatestats(stable, statlist, unitstat)};
		}, null, icons, vars.unitsperrow);
	});

	var bicons = []
	for (var n = 0; n < Vars.content.blocks().size; n++) {
		bicons.push(Vars.content.blocks().get(n).uiIcon)
	};
	bstatdialog.buttons.button("Choose Block", Icon.add, () => {
		ui.selectgrid("Choose Block", Vars.content.blocks(), b => {
			blockstat = b;
			if (bstable != null){updatestats(bstable, bstatlist, blockstat)};
		}, null, bicons, vars.blocksperrow);
	});
	statdialog.buttons.button("Choose Current Unit", Icon.effect, currentunit).width(300);

	gamedialog.buttons.button("Clear Banned Blocks", Icon.cancel, clearbanned).width(300);

	blockdialog.buttons.button("Place", Icon.add, spawnblock)
		.disabled(() => !Vars.world.passable(bpos.x / 8, bpos.y / 8));

	effectdialog.buttons.button("Apply Effect", Icon.add, apply);

	effectdialog.buttons.button("Apply Permanently", Icon.save, applyperma);

	effectdialog.buttons.button("Clear Effects", Icon.cancel, clear)

	spawnerButton = spawndialog.buttons.button("Spawn", Icon.commandAttack, spawn)
		.disabled(() => !Vars.world.passable(spos.x / 8, spos.y / 8));

	teamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	teamRect.tint.set(team.color);
	spawndialog.buttons.button("Team", teamRect, vars.iconSize, () => {
	 	ui.select("Team", Team.all, t => {
	 		team = t;
	 		teamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t, null);
	});

	bteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	bteamRect.tint.set(team.color);
	blockdialog.buttons.button("Team", bteamRect, vars.iconSize, () => {
	 	ui.select("Team", Team.all, t => {
	 		team = t;
	 		bteamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t, null);
	});
	print("Loaded Sandbox Tools!")
}));