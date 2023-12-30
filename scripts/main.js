/* command parameters */
let TCOffset = Core.settings.getBool("mod-time-control-enabled", false) ? 62 : 0;
const maxCount = 100;
const maxRand = 10;

const maxDuration = 320;

const spos = new Vec2(-1, -1);
const bpos = new Vec2(-1, -1);

var team = Vars.state.rules.waveTeam;

var duration = 30;

var spawning = UnitTypes.dagger, count = 1;
var fuser = UnitTypes.dagger, count = 1;
var effect = Vars.content.statusEffects().get(1);
var block = Blocks.coreNucleus;

var rand = 2;

var initialized = false;
var fuseMode = false;

var playername = "";

const teams = [Team.derelict, Team.sharded, Team.crux, Team.green, Team.malis, Team.blue];

const ais = ["None", "MBuilderAI", "BuilderAI", "RepairAI"]

var selectedai = 0;

var playerAI = null;

/* Ui Elements */
var healthUI
var spawndialog = null, button = null;
var effectdialog = null, button = null;
var blockdialog = null, button = null;
var gamedialog = null, button = null;
var statdialog = null, button = null;
var selectdialog = null;

var valuedialog = null, button = null;

var spawntable = new Table().bottom().left();
var playertable = new Table().bottom().left();
var teamtable = new Table().bottom().left();

var sbutton;
var ebutton;
var bbutton;
var gbutton;
var stbutton;

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
var statlist;

var mode = "b"

var teamRect
var bteamRect

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
	var ai = ais[selectedai];
	if (teamRect && bteamRect){
		teamRect.tint.set(team.color);
		bteamRect.tint.set(team.color);
	};
	
	if (playerAI){
		if (ai == "MBuilderAI" && Vars.player.unit().type.mineSpeed > 0 && Vars.player.unit().plans.size == 0){
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
		teamtable.visible = Vars.ui.hudGroup.children.get(3).visible
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

function select(title, values, selector, names){
	if (values instanceof Seq) {
		values = values.toArray();
	}

	if (!names) names = values;
	if (typeof(names) != "function") {
		const arr = names;
		names = i => arr[i];
	}

	Core.app.post(() => {
		selectdialog.rebuild(title, values, selector, names);
		selectdialog.show();
	});
}
//---

/* Local Fucntions */
function spawnLocal() {
	for (var n = 0; n < count; n++) {
		Tmp.v1.rnd(Mathf.random(rand * Vars.tilesize));

		var unit = spawning.spawn(team, spos.x + Tmp.v1.x, spos.y + Tmp.v1.y);

		// var unit = spawning.create(team);
		// unit.set(spos.x + Tmp.v1.x, spos.y + Tmp.v1.y);
		// unit.add();

		if (fuseMode){
			unit.type = fuser
		};
		Fx.spawnShockwave.at(spos.x, spos.y, 0);
	}
};

function spawnblockLocal() {
	Vars.world.tileWorld(bpos.x, bpos.y).setNet(block, team, 0);
};

function changeteamLocal(setteam) {
	Vars.player.team(setteam);
};

function applyLocal(perma) {
	let p = Vars.player.unit();
	if(p != null){
		p.apply(effect, perma ? Infinity : duration * 60);
	}
};

function killLocal() {
	let p = Vars.player.unit();
	if(p != null){
		p.kill();
	}
};

function clearLocal() {
	let p = Vars.player.unit();
	if(p != null){
		p.clearStatuses();
	}
};

function healLocal(inv) {
	let p = Vars.player.unit();
	if(p != null){
		if (inv == false){
			p.dead = false;
			p.maxHealth = p.type.health;
			p.health = p.maxHealth;
		}else{
			p.dead = false;
			p.maxHealth = Infinity;
			p.health = Infinity;
		}
	}
};

function setRuleLocal(rule, value) {
	Vars.state.rules[rule] = value;
};

function setStatLocal(rule, value) {
	Vars.player.unit().type[rule] = value;
};

function clearbannedLocal(){
	Vars.state.rules.bannedBlocks = new ObjectSet();

	const blocks = Vars.content.blocks();
	blocks.each(blo => {
		try{
			blo.buildVisibility = BuildVisibility.shown;
		} catch (e){
			
		};
		
	});
};

/* Multiplayer Functions */
function spawnRemote() {
	const unitcode = "UnitTypes." + spawning.name;
	const fusecode = "UnitTypes." + fuser.name;
	const teamcode = "Team." + team.name;

	let code = [
		// loop optimisation
		"Tmp.v1.rnd(" + Mathf.random(rand * Vars.tilesize) + ");",
		"var u=" + unitcode + ".spawn(" + teamcode + "," + spos.x + "+Tmp.v1.x," + spos.y + "+Tmp.v1.y);",
		"u.type = " + (fuseMode ? fusecode : unitcode),
	].join("");

	for (var n = 0; n < count; n++) {
		Call.sendChatMessage("/js " + code);
	}
	Call.sendChatMessage("/js " + unitcode + ".allowLegStep = true");
	Call.sendChatMessage("/js " + fusecode + ".allowLegStep = true");
	Fx.spawnShockwave.at(spos.x, spos.y, 0);
};

function spawnblockRemote() {
	let code = ['Vars.world.tileWorld(' + bpos.x.toString() + ',' + bpos.y.toString() + ').setNet(Vars.content.getByName(ContentType.block, "' + block.name + '"), Team.' + team.name + ', 0)'];
	Call.sendChatMessage("/js " + code);
};

function changeteamRemote(setteam) {
	definefindp();

	let code = ['p=findp("' + playername + '");p.team(Team.' + setteam.name + ')'];
	Call.sendChatMessage("/js " + code);
};

function applyRemote(perma) {
	definefindp();

	let effectname = effect.localizedName;
	effectname = effectname.charAt(0).toLowerCase() + effectname.slice(1);
	effectname = effectname.replace(/\s/g, '');

	let code = ['p=findp("' 
		+ playername + 
		'");p.unit().apply(StatusEffects.' + 
		effectname + 
		',' + 
		(perma ? Infinity : duration * 60).toString() + 
		')'
	];
	Call.sendChatMessage("/js " + code);
};

function killRemote() {
	definefindp();

	let code = ['p=findp("' + playername + '"); p.unit().kill()'];
	Call.sendChatMessage("/js " + code);
};

function clearRemote() {
	definefindp();

	let code = ['p=findp("' + playername + '"); p.unit().clearStatuses()'];
	Call.sendChatMessage("/js " + code);
};

function healRemote(inv) {
	definefindp();

	healLocal(inv);

	let sethealth = 0

	let code = ['p=findp("' 
	+ playername + 
	'");p.unit().maxHealth = ' +
	(inv ? "Infinity" : "p.unit().type.health") +
	";p.unit().health = p.unit().maxHealth"
	];

	Call.sendChatMessage("/js " + code);
};

function setRuleRemote(rule, value, set) {
	let code = ["Vars.state.rules['" + rule + "']=" + value.toString()];

	Call.sendChatMessage("/js " + code);

	setRuleLocal(rule, value, set);
};

function setStatRemote(rule, value, set) {
	let code = ["UnitTypes." + Vars.player.unit().type + "." + rule + "=" + value.toString()];

	Call.sendChatMessage("/js " + code);

	setStatLocal(rule, value, set);
};

function clearbannedRemote(){
	Call.sendChatMessage("/js const blocks = Vars.content.blocks();blocks.each(blo => {try{blo.buildVisibility = BuildVisibility.shown;}catch (e){};});");
	Call.sendChatMessage("/js Vars.state.rules.bannedBlocks=new ObjectSet()");
};

function spawn() {
	(Vars.net.client() ? spawnRemote : spawnLocal)();
};

function spawnblock() {
	(Vars.net.client() ? spawnblockRemote : spawnblockLocal)();
};

function apply() {
	(Vars.net.client() ? applyRemote : applyLocal)(false);
};

function kill() {
	(Vars.net.client() ? killRemote : killLocal)();
};

function applyperma() {
	(Vars.net.client() ? applyRemote : applyLocal)(true);
};

function clear() {
	(Vars.net.client() ? clearRemote : clearLocal)();
};

function clearbanned() {
	clearbannedLocal();
	if(Vars.net.client()){
		clearbannedRemote();
	};
};

function definefindp() {
	Call.sendChatMessage("/js findp = name => Groups.player.find(e=>Strings.stripColors(e.name)==name)");
};

function updatestats(table, list, set) {
	let rulemode = (set == Vars.state.rules)
	
	if(list){
		let c = 0;
		for (let stat in set) {
			
			if (Object.prototype.toString.call(set[stat]) == "[object Boolean]" || Object.prototype.toString.call(set[stat]) == "[object Number]"){
				let valuebutton = list.children.get(c)
				c++
				if (Object.prototype.toString.call(set[stat]) == "[object Boolean]" && valuebutton.name == "boolean"){
					let value					
					if (rulemode){
						value = Vars.state.rules[stat];
					}else{
						value = Vars.player.unit().type[stat];
					};
					
					if (value){
					 	let icon = new TextureRegionDrawable(Icon.ok).tint(Color.acid);
					 	valuebutton.getCells().first().get().setDrawable(icon);
					 	valuebutton.getLabel().text = "[acid]" + stat
					}else{
					 	let icon = new TextureRegionDrawable(Icon.cancel).tint(Color.scarlet);
					 	valuebutton.getCells().first().get().setDrawable(icon);
					 	valuebutton.getLabel().text = "[scarlet]" + stat
					};
				};
			};
		};

	}else{
		table.pane(slist => {
			// ugly hard-coded
			if (rulemode){rulelist = slist}else{statlist = slist};

			let i = 0;
			for (let stat in set) {

				let setstat = stat

				if (Object.prototype.toString.call(set[setstat]) == "[object Boolean]"){
					if (i++ % 3 == 0) {
						slist.row();
					};
					
					
					let statbutton = slist.button(setstat, Icon.cancel, () => {
						// ugly hard-coded (this section must be synced)
						let enabled
						if (rulemode){
							(Vars.net.client() ? setRuleRemote : setRuleLocal)(setstat, !Vars.state.rules[setstat]);
							enabled = Vars.state.rules[setstat];
						}else{
							(Vars.net.client() ? setStatRemote : setStatLocal)(setstat, !Vars.player.unit().type[setstat]);
							enabled = Vars.player.unit().type[setstat];
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
						// ugly hard-coded (this section must be synced)
						if (rulemode){
							var vField = vd.field(Vars.state.rules[setstat], text => {
								(Vars.net.client() ? setRuleRemote : setRuleLocal)(setstat, parseFloat(text));
							}).get();
							vField.validator = text => !isNaN(parseFloat(text));
						}else{
							var vField = vd.field(Vars.player.unit().type[setstat], text => {
								(Vars.net.client() ? setStatRemote : setStatLocal)(setstat, parseFloat(text));
							}).get();
							vField.validator = text => !isNaN(parseFloat(text));

						};
						
					}).width(300);
				};
		
			};
		}).growX().top().center();
	};
};

Events.on(UnitControlEvent, event => {
	if (stable != null){updatestats(stable, statlist, Vars.player.unit().type)};
});

Events.on(EventType.WorldLoadEvent, e => {
	if (gtable != null){updatestats(gtable, rulelist, Vars.state.rules)};
	if (stable != null){updatestats(stable, statlist, Vars.player.unit().type)};

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
	 	 	(Vars.net.client() ? healRemote : healLocal)(false);
	 	});

	 	let ibutton = instanceButton(Icon.modeSurvival, "Become Invincible", Styles.defaulti, () => {
	 		if (Vars.state.rules.sector) {
	 			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
	 			return;
	 		};
	 		Fx.blastExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/8);
	 		(Vars.net.client() ? healRemote : healLocal)(true);
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
		rebuild(title, values, selector, names) {
			this.cont.clear();
			this.title.text = title;

			this.cont.pane(t => {
				for (var i in values) {
					const key = i;
					t.button(names(i, values[i]), () => {
						selector(values[key]);
						this.hide();
					}).growX().pad(8);
					t.row();
				}
			}).size(400, 350);
		}
	});
	selectdialog.addCloseButton();
	selectdialog;

	playername = Core.settings.getString("name").trim();

	Vars.ui.hudGroup.addChild(spawntable); 
	Vars.ui.hudGroup.addChild(playertable);
	Vars.ui.hudGroup.addChild(teamtable);

	/* create folders */
	var spawntableinside;
	spawntable.table(Styles.black5, cons(t2 => {
	t2.background(Tex.buttonEdge3);
	spawntableinside = t2;
	})).padBottom(160 + TCOffset).padLeft(0).name("SpawnTable");

	var playertableinside;
	playertable.table(Styles.black5, cons(t => {
		t.background(Tex.buttonEdge3);
		playertableinside = t;
	})).padBottom(80 + TCOffset).padLeft(0);

	var teamtableinside;
	teamtable.table(Styles.black5, cons(t => {
		t.background(Tex.pane);
		teamtableinside = t;
	})).padBottom(0 + TCOffset).padLeft(0);

	/* create buttons */
	// let spawnicon = new TextureRegionDrawable(spawning.uiIcon);
	gbutton = createButton(spawntable, spawntableinside, "Game", Icon.menu, "Change game rules", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		gamedialog.show();
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

	stbutton = createButton(playertable, playertableinside, "Edit", Icon.pencil, "Edit unit stats", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			return;
		};

		statdialog.show();
	});

	let aibutton = createButton(playertable, playertableinside, "Change AI", Icon.logic, "Change AI", Styles.defaulti, () => {
		selectedai++

		if (selectedai > ais.length - 1){selectedai = 0};

		var ai = ais[selectedai];

		if (ai == "MBuilderAI"){
			aibutton.style.imageUp = Icon.hammer
			aibutton.style.imageUpColor = Color.orange
			playerAI = new BuilderAI();
		
		}else if (ai == "BuilderAI"){
			aibutton.style.imageUp = Icon.hammer
			aibutton.style.imageUpColor = Color.royal
			playerAI = new BuilderAI();
		}else if (ai == "RepairAI"){
			aibutton.style.imageUp = Icon.add
			aibutton.style.imageUpColor = Color.acid
			playerAI = new RepairAI();
		}else{
			aibutton.style.imageUp = Icon.logic
			aibutton.style.imageUpColor = Color.white
			playerAI = null
		};

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
		(Vars.net.client() ? healRemote : healLocal)(true);
	});
	let hbutton = createButton(playertable, playertableinside, "Heal to full health", Icon.add, "Heal to full health", Styles.defaulti, () => {
	if (Vars.state.rules.sector) {
		Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
		return;
	};

		Fx.greenBomb.at(Vars.player.getX(), Vars.player.getY(), 0);
	 	(Vars.net.client() ? healRemote : healLocal)(false);
	});
	
	let kbutton = createButton(playertable, playertableinside, "Kill the current unit", Icon.commandAttack, "Kill the current unit", Styles.defaulti, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			 return;
		 };
		
		 Fx.dynamicExplosion.at(Vars.player.getX(), Vars.player.getY(), Vars.player.unit().type.hitSize/16);
		 kill();
	 });

	for (let tea of teams) {

	 	let setteam = tea;

	 	const tteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	 	tteamRect.tint.set(tea.color);
	 	createButton(teamtable, teamtableinside, tea.name, tteamRect, tea.name, Styles.cleari, () => {
		if (Vars.state.rules.sector) {
			Vars.ui.showInfoToast("[scarlet]NOO CHEATING >_<", 5);
			//return;
		};
			
	 		(Vars.net.client() ? changeteamRemote : changeteamLocal)(setteam);
	 	});
	 };

	spawndialog = new BaseDialog("Spawn Menu");
	effectdialog = new BaseDialog("Effect Menu");
	blockdialog = new BaseDialog("Block Menu");
	gamedialog = new BaseDialog("Game Menu");
	statdialog = new BaseDialog("Stat Menu");

	const table = spawndialog.cont;
	const etable = effectdialog.cont;
	const btable = blockdialog.cont;
	stable = statdialog.cont;
	gtable = gamedialog.cont;

	/* Name */
	table.label(() => spawningLabelText);
	spawningLabelText = spawning.localizedName;
	table.row();

	etable.label(() => effect.localizedName + (effect.permanent ? " (Permanent effect)" : ""));
	etable.row();

	btable.label(() => block.localizedName);
	btable.row();

	stable.label(() => Vars.player.unit().type.localizedName);
	stable.row();

	/* Selection */
	spawnlists.push(table.pane(slist => {
		const units = Vars.content.units();
		units.sort();
		var i = 0;
		units.each(unit => {
			// Block "unit" for payloads
			//if (unit.isHidden()) return;

			if (i++ % 10 == 0) {
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
		});
	}).growX().top().left());
	table.row();

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

	
	btable.pane(blist => {
		const blocks = Vars.content.blocks();
		blocks.sort();
		let i = 0;
		blocks.each(blo => {

			if (i++ % 10 == 0) {
				blist.row();
			}

			const icon = new TextureRegionDrawable(blo.uiIcon);
			blist.button(icon, () => {
				block = blo;
				bbutton.style.imageUp = icon;
			}).size(76).tooltip(blo.localizedName);
		});
	}).growX().top().center();
	btable.row();


	updatestats(gtable, rulelist, Vars.state.rules);
	gtable.row();

	updatestats(stable, statlist, UnitTypes.crawler);
	stable.row();

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

	/* Random selection */
	const r = table.table().center().bottom().get();
	var rSlider, rField;
	r.defaults().left();
	rSlider = r.slider(0, maxRand, 0.125, rand, n => {
		rand = n;
		rField.text = n;
	}).get();
	r.add("Randomness: ");
	rField = r.field("" + rand, text => {
		rand = parseInt(text);
		rSlider.value = rand;
	}).get();
	rField.validator = text => !isNaN(parseInt(text));
	table.row();
    
	/* Count selection */
	const t = table.table().center().bottom().get();
	var cSlider, cField;
	t.defaults().left();
	cSlider = t.slider(1, maxCount, count, n => {
		count = n;
		cField.text = n;
	}).get();
	
	t.add("Count: ");
	cField = t.field("" + count, text => {
		count = parseInt(text);
		cSlider.value = count;
	}).get();
	cField.validator = text => !isNaN(parseInt(text));

	table.row();

	table.button("Toggle Mode", () => {
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
	table.row();

	var poss;
	poss = table.button("Set Position", () => {
		spawndialog.hide();
		click((screen, world) => {
			// We don't need sub-wu precision + make /js output nicer
			spos.set(Math.round(world.x), Math.round(world.y));
			poss.getLabel().text = "Spawn at " + Math.round(spos.x / 8)
				+ ", " + Math.round(spos.y / 8);
				spawndialog.show();
		}, true);
	}).width(200).get();

	table.row();

	var posb;
	posb = btable.button("Set Position", () => {
		blockdialog.hide();
		click((screen, world) => {
			// We don't need sub-wu precision + make /js output nicer
			bpos.set(Math.round(world.x), Math.round(world.y));
			posb.getLabel().text = "Place at " + Math.round(bpos.x / 8)
				+ ", " + Math.round(bpos.y / 8);
				blockdialog.show();
		}, true);
	}).width(200).get();

	btable.row();

	/* Buttons */
	spawndialog.addCloseButton();
	effectdialog.addCloseButton();
	blockdialog.addCloseButton();
	gamedialog.addCloseButton();
	statdialog.addCloseButton();

	gamedialog.buttons.button("Clear Banned Blocks", Icon.cancel, clearbanned).width(200);

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
	 	select("Team", Team.baseTeams, t => {
	 		team = t;
	 		teamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t);
	});

	bteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	bteamRect.tint.set(team.color);
	blockdialog.buttons.button("Team", bteamRect, 40, () => {
	 	select("Team", Team.baseTeams, t => {
	 		team = t;
	 		bteamRect.tint.set(team.color);
	 	}, (i, t) => "[#" + t.color + "]" + t);
	});
	print("Loaded Sandbox Tools!")
}));