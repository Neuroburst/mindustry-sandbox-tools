// Dialog creation

var engine
const vars = require("sandbox-tools/vars")
const ui = require("sandbox-tools/ui")

// tables that need to be regenerated for searching
var bufilter = "";

var spawnlists = [];

var poss;
var posb;
var rotb;

var spawndialog = null
var countdialog = null
var statusdialog = null
var blockdialog = null
var gamedialog = null
var statdialog = null
var bstatdialog = null
var valuedialog = null
var weapondialog = null
var weaponstatdialog = null
var bulletstatdialog = null
let rangedialog = null
var filldialog = null

var rulesTable;
var statsTable;
var blockStatsTable;
var weaponTable
var weaponStatsTable
var bulletStatsTable
var countTable;

var spawnerButton;
var spawningLabelText;
var placeButton;

function createDialogs(){
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
	createCountDialog();
}

function createCountDialog(){
	countdialog = new BaseDialog("Unit Count Menu");
	countTable = countdialog.cont;
	const i = countTable.table().center().top().get();
	i.defaults().left()
	i.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(ssearch);
	}).size(50, 50).get()
	var ssearch = i.field(engine.cfilter, text => {
		engine.cfilter = text;
		updatecountlist(engine.cfilter, countTable, engine.cteam)
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	ssearch.setMessageText("Search Units")
	countTable.row();
	updatecountlist("", countTable, null);
	countdialog.addCloseButton();
}

function createStatusDialog(){
	statusdialog = new BaseDialog("Status Menu");
	let statusTable = statusdialog.cont;
	statusTable.label(() => engine.effect.localizedName + (engine.effect.permanent ? " (Permanent effect)" : ""));
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
				engine.effect = eff;
				engine.statusButton.style.imageUp = icon;
			}).pad(vars.gridPad).size(vars.gridButtonSize);
			let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add(eff.localizedName).style(Styles.outlineLabel)})
			b.get().addListener(tooltip)
		});
	}).growX().top().center();
	statusTable.row();

	const d = statusTable.table().center().bottom().pad(vars.gridPad).get();
	var dSlider, dField;
	d.defaults().left();
	dSlider = d.slider(0, engine.maxDuration, 0.125, engine.duration, n => {
		engine.duration = n;
		dField.text = n;
	}).get();
	d.add(vars.iconRoom + "Duration: ");
	dField = d.field("" + engine.duration, text => {
		engine.duration = parseInt(text);
		dSlider.value = engine.duration;
	}).get();
	dField.validator = text => !isNaN(parseInt(text));
	statusTable.row();

	statusdialog.addCloseButton();
	statusdialog.buttons.button("Clear Effects", Icon.cancel, engine.clear);//.width(vars.optionButtonWidth).pad(vars.gridPad);

	const o = statusTable.table().center().bottom().pad(vars.gridPad).get();
	o.defaults().left();
	let applyButton = o.button("Apply Effect", Icon.add, engine.apply).width(vars.optionButtonWidth).pad(vars.gridPad);
	o.button("Apply Permanently", Icon.save, engine.applyperma).width(300).pad(vars.gridPad);
	applyButton.disabled(() => engine.effect.permanent)
	
};

function createSpawnDialog(){
	spawndialog = new BaseDialog("Spawn Menu");
	let spawnTable = spawndialog.cont;
	const i = spawnTable.table().center().top().get();
	i.defaults().left()
	i.button(Icon.zoom, Styles.flati, () => {
		Core.scene.setKeyboardFocus(ssearch);
	}).size(50, 50).get()
	var ssearch = i.field(engine.ufilter, text => {
		engine.ufilter = text;
		updatespawnlist(engine.ufilter, spawnTable)
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	ssearch.setMessageText("Search Units")
	spawnTable.row();

	spawningLabelText = engine.spawning.localizedName;
	spawnTable.label(() => spawningLabelText);
	
	updatespawnlist("", spawnTable);

	spawndialog.addCloseButton();
	
	spawnerButton = ui.createButton(spawndialog.buttons, null, "Spawn", new TextureRegionDrawable(engine.spawning.uiIcon), "", Styles.defaulti, true, () => {
		engine.spawn();
	}).disabled(() => !Vars.world.passable(engine.spos.x / 8, engine.spos.y / 8)).width(300).get();
	spawnerButton.label(() => vars.iconRoom + "Spawn")

	engine.steamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	engine.steamRect.tint.set(engine.team.color);
	spawndialog.buttons.button("Team", engine.steamRect, vars.iconSize, () => {
		let processedNames = []
		let processedIcons = []
		for (let i in Team.all){
			let team = Team.all[i]
			processedNames.push(team.name)
			let rect = extend(TextureRegionDrawable, Tex.whiteui, {});
			rect.tint.set(team.color);
			processedIcons.push(rect)
		}
		ui.selectgrid("Choose Team", processedNames, Team.all, t => {
	 		engine.team = t;
	 		engine.steamRect.tint.set(engine.team.color);
		}, processedIcons, vars.teamsperrow, "Search Teams", true, vars.largeIconSize);
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
	var wssearch = ws.field(engine.wsfilter, text => {
		engine.wsfilter = text;
		updatestats(engine.wsfilter, weaponStatsTable, engine.weaponstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	wssearch.setMessageText("Search Weapon Stats")
	weaponStatsTable.row();
	updatestats("", weaponStatsTable, engine.weaponstat);	
	weaponstatdialog.addCloseButton();
	weaponstatdialog.buttons.button("Remove Weapon", Icon.cancel, () => {
		engine.removeWeapon();
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
	var busearch = bu.field(engine.ufilter, text => {
		engine.ufilter = text;
		updatestats(engine.ufilter, bulletStatsTable, engine.bulletstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	busearch.setMessageText("Search Bullet Stats")
	bulletStatsTable.row();
	updatestats("", bulletStatsTable, engine.bulletstat);
	bulletstatdialog.addCloseButton();
}

function createRangeDialog(){
	rangedialog = new BaseDialog("Range Menu");
	let rangedialogTable = rangedialog.cont;
	rangedialogTable.check(vars.iconRoom + "Show Ground", engine.viewGroundRange, () => {
		engine.viewGroundRange = !engine.viewGroundRange
	}).pad(vars.gridPad);
	rangedialogTable.row();

	rangedialogTable.check(vars.iconRoom + "Show Air", engine.viewAirRange, () => {
		engine.viewAirRange = !engine.viewAirRange
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
	filldialogTable.check(vars.iconRoom + "Fill Core", engine.fillMode == true, () => {
		engine.fillMode = true
		createFillDialog(true)
	}).pad(vars.gridPad);
	filldialogTable.row();

	emptycheck = filldialogTable.check(vars.iconRoom + "Empty Core", engine.fillMode == false, () => {
		engine.fillMode = false
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
	var bsearch = b.field(engine.ufilter, text => {
		engine.ufilter = text;
		updateblocklist(engine.ufilter, blockTable)
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	bsearch.setMessageText("Search Blocks")
	blockTable.row();

	blockTable.label(() => engine.block.localizedName);
	updateblocklist("", blockTable);

	blockdialog.addCloseButton();

	placeButton = blockdialog.buttons.button("Place", new TextureRegionDrawable(engine.block.uiIcon), 42, () => {
		engine.spawnblock(false);
	}).disabled(() => !Vars.world.passable(engine.bpos.x / 8, engine.bpos.y / 8)).width(300).get();

	engine.bteamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	engine.bteamRect.tint.set(engine.team.color);
	blockdialog.buttons.button("Team", engine.bteamRect, vars.iconSize, () => {
		let processedNames = []
		let processedIcons = []
		for (let i in Team.all){
			let team = Team.all[i]
			processedNames.push(team.name)
			let rect = extend(TextureRegionDrawable, Tex.whiteui, {});
			rect.tint.set(team.color);
			processedIcons.push(rect)
		}
		ui.selectgrid("Choose Team", processedNames, Team.all, t => {
			engine.team = t;
			engine.bteamRect.tint.set(engine.team.color);
		}, processedIcons, vars.teamsperrow, "Search Teams", true, vars.largeIconSize);
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
	gamedialog.buttons.button("Clear Banned Blocks", Icon.cancel, engine.clearbanned).width(300);
	if (updateButtons){
		return
	}

	var rsearch = r.field(engine.rfilter, text => {
		engine.rfilter = text;
		createRulesDialog(true);
		updatestats(engine.rfilter, rulesTable, Vars.state.rules);
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
	var ussearch = u.field(engine.usfilter, text => {
		engine.usfilter = text;
		updatestats(engine.usfilter, statsTable, engine.unitstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	ussearch.setMessageText("Search Unit Stats")
	statsTable.row();
	updatestats("", statsTable, engine.unitstat);
	statdialog.addCloseButton();
	
	var icons = []
	var processedUnits = []
	for (var n = 0; n < Vars.content.units().size; n++) {
		icons.push(Vars.content.units().get(n).uiIcon)
		processedUnits.push(Vars.content.units().get(n).localizedName)
	};
	
	let cunit = ui.createButton(statdialog.buttons, null, "Choose Unit", new TextureRegionDrawable(engine.unitstat.uiIcon), "", Styles.defaulti, true, () => {
		ui.selectgrid("Choose Unit", processedUnits, Vars.content.units(), u => {
			engine.unitstat = u;
			var icon = new TextureRegionDrawable(engine.unitstat.uiIcon)
			cunit.style.imageUp = icon
			if (statsTable != null){updatestats(engine.usfilter, statsTable, engine.unitstat)};
		}, icons, vars.unitsperrow, "Search Units");
	}).width(300).get();
	cunit.label(() => vars.iconRoom + "Choose Unit")

	statdialog.buttons.button("Choose Current Unit", Icon.effect, () => {
		engine.unitstat = Vars.player.unit().type
		if (statsTable != null){updatestats(engine.usfilter, statsTable, engine.unitstat)};

		var icon = new TextureRegionDrawable(engine.unitstat.uiIcon)
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
	var bsearch = b.field(engine.bsfilter, text => {
		engine.bsfilter = text;
		updatestats(engine.bsfilter, blockStatsTable, engine.blockstat);
	}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
	bsearch.setMessageText("Search Block Stats")
	blockStatsTable.row();
	updatestats("", blockStatsTable, engine.blockstat);
	bstatdialog.addCloseButton();

	var bicons = []
	var processedBlocks = []
	for (var n = 0; n < Vars.content.blocks().size; n++) {
		bicons.push(Vars.content.blocks().get(n).uiIcon)
		processedBlocks.push(Vars.content.blocks().get(n).localizedName)
	};

	let cblock = bstatdialog.buttons.button("Choose Block", new TextureRegionDrawable(engine.blockstat.uiIcon), 42, () => {
		ui.selectgrid("Choose Block", processedBlocks, Vars.content.blocks(), b => {
			engine.blockstat = b;
			cblock.getCells().first().get().setDrawable(new TextureRegionDrawable(engine.blockstat.uiIcon));
			if (blockStatsTable != null){updatestats(engine.bsfilter, blockStatsTable, engine.blockstat)};
		}, bicons, vars.blocksperrow, "Search Blocks");
	}).width(300).get();
};

function updatecountlist(filter, ctable, team){
	if (ctable.getCells().size >= 2){
		ctable.getCells().get(1).clearElement();
		ctable.getCells().remove(1);
	}
	ctable.row()
	if (team){
		ctable.pane(clist => {
			const types = Vars.content.units()

			var units = team.data().units.toArray()

			var i = 0;
			types.each(unit => {
				var count = units.filter(x => x.type==unit).length
				if (count == 0){
					return
				}

				var show = true
				if (filter && filter.trim().length > 0){
					let cfilter = filter.trim().toLowerCase()
		
					if (!unit.localizedName.toLowerCase().includes(cfilter)){
						show = false
					}
				};
				if (show){
					if (i++ % 4 == 0) {
						clist.row();
					}

					const icon = new TextureRegionDrawable(unit.uiIcon);
					var text = String(count) + " " + unit.localizedName + (count > 1 ? (unit.localizedName.toLowerCase().endsWith("s") || unit.localizedName.toLowerCase().endsWith("x") ? "es" : "s") : "")
					
					let avgHealth = 0
					for (let n in units){
						let u = units[n]
						if (u.type == unit){
							avgHealth += u.health / u.type.health
						}
					}
					avgHealth = Math.round((avgHealth / count) * 100)

					var newButton = ui.createButton(clist, null, text, icon, "", Styles.defaulti, true, () => {	
					}).pad(vars.gridPad).width(300).get();
					newButton.label(() => vars.iconRoom + text)
					let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add("Average Health: " + String(avgHealth) + "%").style(Styles.outlineLabel)})
					newButton.addListener(tooltip)
				};
			});
		}).growX().top().left();
		ctable.row();
	}
}

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
					if (engine.fuseMode) {
						engine.fuser = unit;
						spawningLabelText = engine.spawning.localizedName + " fused with " + engine.fuser.localizedName;
					}else{
						engine.spawning = unit;
						spawningLabelText = engine.spawning.localizedName;
					};
					if (!engine.fuseMode){
						spawnerButton.style.imageUp = icon;
					}
					engine.spawnMenuButton.style.imageUp = icon;
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
	var rSlider = r.slider(0, engine.maxRand, 0.125, engine.rand, n => {
		engine.rand = n;
		rField.text = n;
	}).get();
	r.add(vars.iconRoom + "Spread: ");
	var rField = r.field("" + engine.rand, text => {
		engine.rand = parseInt(text);
		rSlider.value = engine.rand;
	}).get();
	rField.validator = text => !isNaN(parseInt(text));
	utable.row();
	
	/* Count selection */
	let t = utable.table().center().bottom().get();
	t.defaults().left();
	var cSlider = t.slider(1, engine.maxCount, engine.count, n => {
		engine.count = n;
		cField.text = n;
	}).get();
	
	t.add(vars.iconRoom + "Count: ");
	var cField = t.field("" + engine.count, text => {
		engine.count = parseInt(text);
		cSlider.value = engine.count;
	}).get();
	cField.validator = text => !isNaN(parseInt(text));

	utable.row();

	const u = utable.table().center().bottom().get();
	u.defaults().left();

	u.button("Toggle Mode", Icon.refresh, () => {
		engine.fuseMode = !engine.fuseMode;
		if (engine.fuseMode) {
			spawnerButton.style.imageUp = Icon.refresh;
	 		//spawnerButton.getCells().get(1).get().text = vars.iconRoom + "Fuse";
	 	}else{
			const icon = new TextureRegionDrawable(engine.spawning.uiIcon);
			spawnerButton.style.imageUp = icon;
	 		spawningLabelText = engine.spawning.localizedName;
			// spawnerButton.getCells().get(1).get().text = vars.iconRoom + "Spawn";
		};
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();
	poss = u.button("Set Position", Icon.effect, () => {
		spawndialog.hide();
		engine.expectingPos = "Spawn";
	 	ui.click((screen, world) => {
			engine.expectingPos = false;
	 		// We don't need sub-wu precision + make /js output nicer
	 		engine.spos.set(Math.round(world.x), Math.round(world.y));
			Fx.tapBlock.at(engine.spos.x, engine.spos.y);
	 		poss.getLabel().text = "Set Position\n(" + Math.round(engine.spos.x / Vars.tilesize)
	 			+ ", " + Math.round(engine.spos.y / Vars.tilesize) + ")";
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
					engine.block = blo;
					engine.blockButton.style.imageUp = icon;
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
	rotb = o.button("Rotation", rotations[engine.brot], () => {
		engine.brot++;
		if (engine.brot > rotations.length - 1){
			engine.brot = 0
		};
		rotb.getCells().first().get().setDrawable(rotations[engine.brot]);
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();
	posb = o.button("Set Position", Icon.effect, () => {
		blockdialog.hide();
		engine.expectingPos = "Block";
	 	ui.click((screen, world) => {
			engine.expectingPos = false;
	 		// We don't need sub-wu precision + make /js output nicer
	 		engine.bpos.set(Math.round(world.x), Math.round(world.y));
			Fx.tapBlock.at(engine.bpos.x, engine.bpos.y);
	 		posb.getLabel().text = "Set Position\n(" + Math.round(engine.bpos.x / Vars.tilesize)
	 			+ ", " + Math.round(engine.bpos.y / Vars.tilesize) + ")";
	 			blockdialog.show();
	 	}, true);
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();

	o.button("Delete Block", Icon.cancel, () => {
		engine.spawnblock(true);
	}).width(vars.optionButtonWidth).pad(vars.gridPad).get();
};

function traverseStats(filter, slist, set, mode, i){
	for (let stat in set) {
		let setstat = stat
		

		if (Object.prototype.toString.call(set[setstat]) == "[object JavaObject]" && engine.objectsToCheck.includes(setstat)){
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
						(Vars.net.client() ? remoteF.setRuleRemote : engine.localF.setRuleLocal)(setstat, !Vars.state.rules[setstat]);
						enabled = Vars.state.rules[setstat];
					}else{
						(Vars.net.client() ? remoteF.setStatRemote : engine.localF.setStatLocal)(set, setstat, !set[setstat]);
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
						(Vars.net.client() ? remoteF.setRuleRemote : engine.localF.setRuleLocal)(setstat, !Vars.state.rules[setstat]);
						enabled = Vars.state.rules[setstat];
					}else{
						(Vars.net.client() ? remoteF.setStatRemote : engine.localF.setStatLocal)(set, setstat, !set[setstat]);
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
						(Vars.net.client() ? remoteF.setRuleRemote : engine.localF.setRuleLocal)(setstat, parseFloat(text));
						tool.add(text);
					}).get();
				}else{
					vField = vd.field(set[setstat], text => {
						tool.clear();
						(Vars.net.client() ? remoteF.setStatRemote : engine.localF.setStatLocal)(set, setstat, parseFloat(text));
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
	if (set == engine.unitstat) {
		mode = 1
	}else if (set == engine.blockstat) {
		mode = 2
	}else if (set == engine.weaponstat) {
		mode = 3
	}else if (set == engine.bulletstat) {
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
		table.label(() => engine.unitstat.localizedName);
	}else if (mode == 2) {
		table.label(() => engine.blockstat.localizedName);
	}else if (mode == 3){
		table.label(() => engine.weaponstat.name);
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
			updatestats(bufilter, bulletStatsTable, engine.bulletstat);
			bulletstatdialog.show()
		}).width(vars.optionButtonWidth);
	};
};

function updateweaponslist(wtable){
	let weapons = engine.unitstat.weapons
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
				engine.weaponstat = weapon
				engine.bulletstat = engine.weaponstat.bullet
				updatestats(engine.wsfilter, weaponStatsTable, engine.weaponstat);
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
				engine.addWeapon(w);
				updateweaponslist(weaponTable);
			}, weaponIcons, vars.unitsperrow, "Search Weapons")
		}).pad(vars.gridPad).size(vars.gridButtonSize);//.tooltip("Add a new weapon");
		let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add("Add a new weapon").style(Styles.outlineLabel)})
		b.get().addListener(tooltip)
	});
};

module.exports = {
    createDialogs : createDialogs,
    updatestats : updatestats,
	updatespawnlist : updatespawnlist,
	updateweaponslist : updateweaponslist,
	updateblocklist : updateblocklist,
	updatecountlist : updatecountlist,

    // setters
    setengine : (e) => engine = e,

    // getters
    spawndialog : () => spawndialog,
	countdialog : () => countdialog,
    statusdialog : () => statusdialog,
    blockdialog : () => blockdialog,
    gamedialog : () => gamedialog,
    statdialog : () => statdialog,
    bstatdialog : () => bstatdialog,
    valuedialog : () => valuedialog,
    weapondialog : () => weapondialog,
    weaponstatdialog : () => weaponstatdialog,
    bulletstatdialog : () => bulletstatdialog,
    rangedialog : () => rangedialog,
    filldialog : () => filldialog,

    rulesTable : () => rulesTable,
    statsTable : () => statsTable,
    blockStatsTable : () => blockStatsTable,
    weaponTable : () => weaponTable,
    weaponStatsTable : () => weaponStatsTable,
    bulletStatsTable : () => bulletStatsTable,
	countTable : () => countTable,

	placeButton : () => placeButton,
};