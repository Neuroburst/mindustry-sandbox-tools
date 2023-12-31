// TODO: Add custom weapon adder
// TODO: Custom unit abilities
// TODO: Add thingy that lists Vars too! (especially change survival vs attack vs sandbox)

// TODO: Search function for stat menus

// TODO: separate into multiple scripts and cleanup code


// remember to use this to find properties/functions
// for (let stat in _){print(stat)}

/* command parameters */
let TCOffset = Core.settings.getBool("mod-time-control-enabled", false) ? 62 : 0;

const localF = require("localFunctions");
const remoteF = require("remoteFunctions");

const unitsperrow = 10
const blocksperrow = 15

const maxCount = 100;
const maxRand = 10;

const maxDuration = 320;

const spos = new Vec2(-1, -1);
const bpos = new Vec2(-1, -1);

var team = Vars.state.rules.waveTeam;

var unitstat = UnitTypes.dagger
var blockstat = Blocks.coreNucleus

var duration = 30;

var spawning = UnitTypes.dagger, count = 1;
var fuser = UnitTypes.dagger, count = 1;
var effect = Vars.content.statusEffects().get(1);
var block = Blocks.coreNucleus;

var rand = 2;

var initialized = false;
var fuseMode = false;

var playername = "";

const ais = ["None", "MBuilderAI", "BuilderAI", "RepairAI", "AssemblerAI", "BoostAI", "CargoAI", "CommandAI", "DefenderAI", "FlyingAI", "FlyingFollowAI", "GroundAI", "HugAI", "LogicAI", "MinerAI", "MissileAI", "SuicideAI"]

var selectedai = "None";

var playerAI = null;

/* Ui Elements */
var healthUI
var spawndialog = null, button = null;
var effectdialog = null, button = null;
var blockdialog = null, button = null;
var gamedialog = null, button = null;
var statdialog = null, button = null;
var bstatdialog = null, button = null;
var selectdialog = null;

var selectgriddialog = null;

var valuedialog = null, button = null;

var spawntable = new Table().bottom().left();
var playertable = new Table().bottom().left();

var sbutton;
var ebutton;
var bbutton;
var gbutton;
var stbutton;
var bstbutton;
var stubutton;
var aibutton

var spawnerButton;
var spawningLabelText;

/* UI Param */
let mobileWidth = 52;
let mobileHeight = 52;
let buttonHeight = 50;
let buttonWidth = 50;
let iconSize = 42;
let BarHeight = 5;

var spawnlists = [];

var gtable;
var rulelist;

var stable;
var bstable;
var statlist;
var bstatlist;

var mode = "b"

var posb

var teamRect
var bteamRect

var bfilter = ""
var ufilter = ""

var r 
var t
var tmode
var poss

/* click capture */
var clickEvents = [];
const world = new Vec2();

/* UI Creation (Essentially re-writing certain parts of ui-lib) */
function createButton(t, it, name, icon, tooltip, style, clicked){
	const cell = t.button(icon, style, iconSize, ()=>{});
	cell.name(name);
	cell.tooltip(tooltip)
	let button = cell.get();
	let bstyle = button.style;

	if (clicked) {
		button.clicked(() => {
			try {
				clicked(button);
			} catch (e) {
				Vars.ui.showInfoToast("[red]Error when clicking button; " + name + e, 10);
			}
		});
	};
	it.add(button).pad(BarHeight).left().size(buttonWidth, buttonHeight);
	return button;
};

function instanceButton(icon, tooltip, style, clicked){
	//const button = new ImageButton(icon, style);
	var r = new Table().bottom().left();
	r.table(Styles.black5, cons(t => {})).padBottom(20)

	const cell = r.button(icon, style, ()=>{});
	cell.tooltip(tooltip);

	const button = cell.get()

	let bstyle = button.style;

	if (clicked) {
		button.clicked(() => {
			try {
				clicked(button);
			} catch (e) {
				Vars.ui.showInfoToast("[red]Error when clicking button; " + e, 10);
			}
		});
	};

	delete r
	return button;
};

// handling click events
function click(handler, world){
	clickEvents.push({
		handler: handler,
		world: world
	});
	return clickEvents.length - 1;
};

Events.run(Trigger.update, () => {
	print(localF.frog)
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


function select(title, values, selector, names, icons){
	if (values instanceof Seq) {
		values = values.toArray();
	}

	if (!names) names = values;
	if (typeof(names) != "function") {
		const arr = names;
		names = i => arr[i];
	}

	Core.app.post(() => {
		selectdialog.rebuild(title, values, selector, names, icons);
		selectdialog.show();
	});
};

function selectgrid(title, values, selector, names, icons, numperrow){
	if (values instanceof Seq) {
		values = values.toArray();
	}

	if (!names) names = values;
	if (typeof(names) != "function") {
		const arr = names;
		names = i => arr[i];
	}

	Core.app.post(() => {
		selectgriddialog.rebuild(title, values, selector, names, icons, numperrow);
		selectgriddialog.show();
	});
};
//---

function spawn() {
	(Vars.net.client() ? remoteF.spawnRemote() : localF.spawnLocal())();
};

function spawnblock() {
	(Vars.net.client() ? remoteF.spawnblockRemote() : localF.spawnblockLocal())();
};

function apply() {
	(Vars.net.client() ? remoteF.applyRemote() : localF.applyLocal())(false);
};

function kill() {
	(Vars.net.client() ? remoteF.killRemote() : localF.killLocal())();
};

function applyperma() {
	(Vars.net.client() ? remoteF.applyRemote() : localF.applyLocal())(true);
};

function clear() {
	(Vars.net.client() ? remoteF.clearRemote() : localF.clearLocal())();
};

function clearbanned() {
	(Vars.net.client() ? remoteF.clearbannedRemote() : localF.clearbannedLocal())();
};

function definefindp() {
	Call.sendChatMessage("/js findp = name => Groups.player.find(e=>Strings.stripColors(e.name)==name)");
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
				if (i++ % unitsperrow == 0) {
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
	 		poss.getLabel().text = "Spawn at " + Math.round(spos.x / 8)
	 			+ ", " + Math.round(spos.y / 8);
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
				if (i++ % blocksperrow == 0) {
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
						(Vars.net.client() ? setStatRemote : localF.setStatLocal)(setstat, !unitstat[setstat]);
						enabled = unitstat[setstat];
					}else{
						(Vars.net.client() ? setbStatRemote : localF.setbStatLocal)(setstat, !blockstat[setstat]);
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
							(Vars.net.client() ? setStatRemote : localF.setStatLocal)(setstat, parseFloat(text));
						}).get();
						vField.validator = text => !isNaN(parseFloat(text));

					}else {
						var vField = vd.field(blockstat[setstat], text => {
							(Vars.net.client() ? setbStatRemote : localF.setbStatLocal)(setstat, parseFloat(text));
						}).get();
						vField.validator = text => !isNaN(parseFloat(text));
					};
					
				}).width(300);
			};
	
		};
	}).growX().top().center();
	};


Events.on(EventType.WorldLoadEvent, e => {
	if (gtable != null){updatestats(gtable, rulelist, Vars.state.rules)};
	if (stable != null){updatestats(stable, statlist, unitstat)};
	if (bstable != null){updatestats(bstable, bstatlist, blockstat)};

	initialized = true
	if(!initialized){
		healthUI = Vars.ui.hudGroup.children.get(3).children.get(Vars.mobile ? 2 : 0).children.get(0).children.get(0).children.get(0);
		healthUI.row();
		let kbutton = instanceButton(Icon.commandAttack, "Kill the current unit", Styles.defaulti, () => {
			if (Vars.state.rules.sector) {
				Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
	 			return;
	 		};
			
	 		Fx.dynamicExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/16);
	 		kill();
	 	});

		let hbutton = instanceButton(Icon.add, "Heal to full health", Styles.defaulti, () => {
	 		if (Vars.state.rules.sector) {
	 			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
	 			return;
	 		};
		
	 		Fx.greenBomb.at(Vars.player.getX(), Vars.player.getY(), 0);
	 	 	(Vars.net.client() ? healRemote : localF.healLocal)(false);
	 	});

	 	let ibutton = instanceButton(Icon.modeSurvival, "Become Invincible", Styles.defaulti, () => {
	 		if (Vars.state.rules.sector) {
	 			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
	 			return;
	 		};
	 		Fx.blastExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/8);
	 		(Vars.net.client() ? healRemote : localF.healLocal)(true);
	    });

	   
	 	ebutton = instanceButton(Icon.effect, "Apply status effects", Styles.defaulti, () => {
	 		if (Vars.state.rules.sector) {
	 			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
	 			return;
	 		};
	 		effectdialog.show();
	 	});
	   
	 	healthUI.add(kbutton).size(buttonWidth, buttonHeight).pad(5).left().padLeft(0);
	 	healthUI.add(hbutton).size(buttonWidth, buttonHeight).pad(5).left().padLeft(-50);
	 	healthUI.add(ibutton).size(buttonWidth, buttonHeight).pad(5).left().padLeft(-110);
	 	healthUI.add(ebutton).size(buttonWidth, buttonHeight).pad(5).left().padLeft(-40);

	 	kbutton.style.imageUpColor = Color.scarlet
	 	hbutton.style.imageUpColor = Color.acid;
	 	ibutton.style.imageUpColor = Color.sky;
	 	initialized = true;
	};
});

Events.on(EventType.ClientLoadEvent, cons(() => {
	if(Vars.mobile){
		buttonHeight = mobileHeight;
		buttonWidth = mobileWidth;
	};

	selectdialog = extend(BaseDialog, "<title>", {
		rebuild(title, values, selector, names, icons) {
			this.cont.clear();
			this.title.text = title;

			this.cont.pane(t => {
				for (var i in values) {
					const key = i;
					if (icons){
						t.button(names(i, values[i]), new TextureRegionDrawable(icons[i]), 40, () => {
							selector(values[key]);
							this.hide();
						}).growX().pad(8);
					}else{
						t.button(names(i, values[i]), () => {
							selector(values[key]);
							this.hide();
						}).growX().pad(8);
					}

					t.row();
				}
			}).size(400, 800);
		}
	});
	selectdialog.addCloseButton();

	selectgriddialog = extend(BaseDialog, "<title>", {
		rebuild(title, values, selector, names, icons, numperrow) {
			this.cont.clear();
			this.title.text = title;
			this.cont.pane(t => {
				var it = 0;
				for (var i in values){	
					const key = i;	
					if (it++ % numperrow == 0) {
						t.row();
					}
					const icon = new TextureRegionDrawable(icons[i])
					t.button(icon, () => {
						selector(values[key]);
						this.hide();
					}).size(76).tooltip(names(i, values[i]));
				};
			}).growX().top().left();
		}
	});
	selectgriddialog.addCloseButton();


	playername = Core.settings.getString("name").trim();

	Vars.ui.hudGroup.addChild(spawntable); 
	Vars.ui.hudGroup.addChild(playertable);

	/* create folders */
	var spawntableinside;
	spawntable.table(Styles.black5, cons(t2 => {
	t2.background(Tex.buttonEdge3);
	spawntableinside = t2;
	})).padBottom(80 + TCOffset).padLeft(0).name("SpawnTable");

	var playertableinside;
	playertable.table(Styles.black5, cons(t => {
		t.background(Tex.buttonEdge3);
		playertableinside = t;
	})).padBottom(0 + TCOffset).padLeft(0);
	gbutton = createButton(spawntable, spawntableinside, "Game", Icon.menu, "Change game rules", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		gamedialog.show();
	});

	stbutton = createButton(spawntable, spawntableinside, "Edit", Icon.units, "Edit unit stats", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		statdialog.show();
	});

	bstbutton = createButton(spawntable, spawntableinside, "Edit", Icon.pencil, "Edit block stats", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		bstatdialog.show();
	});


	let spawnicon = new TextureRegionDrawable(spawning.uiIcon);
	sbutton = createButton(spawntable, spawntableinside, "Spawn Menu", spawnicon, "Spawn units", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		spawndialog.show();
	});
	
	let blockicon = new TextureRegionDrawable(block.uiIcon);
	bbutton = createButton(spawntable, spawntableinside, "Block Menu", blockicon, "Place blocks", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		blockdialog.show();
	});

	var bbteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	bbteamRect.tint.set(Vars.player.team().color);
	let teambutton = createButton(playertable, playertableinside, "Change Team", bbteamRect, "Change player team", Styles.cleari, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		select("Team", Team.all, t => {
			(Vars.net.client() ? changeteamRemote : localF.changeteamLocal)(t);
			bbteamRect.tint.set(t.color);
		}, (i, t) => "[#" + t.color + "]" + t, null);
   });

	aibutton = createButton(playertable, playertableinside, "Change AI", Icon.logic, "Change player AI", Styles.defaulti, () => {
		select("Choose player AI", ais, changeAI, ais, null)
	});

	ebutton = createButton(playertable, playertableinside, "Apply status effects", Icon.effect, "Apply status effects", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
	 		Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
	 		return;
	 	};
	 	effectdialog.show();
	});

	let ibutton = createButton(playertable, playertableinside, "Become invincible", Icon.modeSurvival, "Become invincible", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};
		Fx.blastExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/8);
		(Vars.net.client() ? healRemote : localF.healLocal)(true);
	});
	let hbutton = createButton(playertable, playertableinside, "Heal to full health", Icon.add, "Heal to full health", Styles.defaulti, () => {
	if (Vars.state.rules.sector) {
		Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
		return;
	};

		Fx.greenBomb.at(Vars.player.getX(), Vars.player.getY(), 0);
	 	(Vars.net.client() ? healRemote : localF.healLocal)(false);
	});
	
	let kbutton = createButton(playertable, playertableinside, "Kill the current unit", Icon.commandAttack, "Kill the player", Styles.defaulti, () => {
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
	}).size(50).get()
	i.field(ufilter, text => {
		ufilter = text;
		updatespawnlist(ufilter, table)
	}).padBottom(4).growX().size(500, 50).tooltip("Search").get();
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
	}).size(50).get();
	b.field(bfilter, text => {
		bfilter = text;
		updateblocklist(bfilter, btable)
	}).padBottom(4).growX().size(500, 50).tooltip("Search").get();
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
		selectgrid("Choose Unit", Vars.content.units(), u => {
			unitstat = u;
			if (stable != null){updatestats(stable, statlist, unitstat)};
		}, null, icons, unitsperrow);
	});

	var bicons = []
	for (var n = 0; n < Vars.content.blocks().size; n++) {
		bicons.push(Vars.content.blocks().get(n).uiIcon)
	};
	bstatdialog.buttons.button("Choose Block", Icon.add, () => {
		selectgrid("Choose Block", Vars.content.blocks(), b => {
			blockstat = b;
			if (bstable != null){updatestats(bstable, bstatlist, blockstat)};
		}, null, bicons, blocksperrow);
	});
	statdialog.buttons.button("Choose Current Unit", Icon.effect, currentunit).width(300);

	gamedialog.buttons.button("Clear Banned Blocks", Icon.cancel, clearbanned).width(300);

	blockdialog.buttons.button("Place", Icon.add, spawnblock)
		.disabled(() => !Vars.world.passable(bpos.x / 8, bpos.y / 8));

	effectdialog.buttons.button("Apply Effect", Icon.add, apply)

	effectdialog.buttons.button("Apply Permanently", Icon.save, applyperma)

	effectdialog.buttons.button("Clear Effects", Icon.cancel, clear)

	spawnerButton = spawndialog.buttons.button("Spawn", Icon.commandAttack, spawn)
		.disabled(() => !Vars.world.passable(spos.x / 8, spos.y / 8));

	teamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	teamRect.tint.set(team.color);
	spawndialog.buttons.button("Team", teamRect, 40, () => {
	 	select("Team", Team.all, t => {
	 		team = t;
	 		teamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t, null);
	});

	bteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	bteamRect.tint.set(team.color);
	blockdialog.buttons.button("Team", bteamRect, 40, () => {
	 	select("Team", Team.all, t => {
	 		team = t;
	 		bteamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t, null);
	});
	print("Loaded Sandbox Tools!")
}));