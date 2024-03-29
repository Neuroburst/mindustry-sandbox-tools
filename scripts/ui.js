// Static ui creation helper functions

const vars = require("sandbox-tools/vars")

var selectdialog = null;
var selectgriddialog = null;
var selectgridfilter = "";

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

// click events
Events.run(Trigger.update, () => {
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


/* UI Creation and Utilities (Essentially re-writing certain parts of ui-lib) */
function createButton(parent, superparent, name, icon, tooltip, style, return_cell, clicked, iconSizeOverride, mini){
	if (!mini){
		mini = 0
	}
	if (!iconSizeOverride){
		iconSizeOverride = vars.iconSize
	}
	var cell = parent.button(icon, style, iconSizeOverride - mini, ()=>{});
	cell.name(name);
	if (tooltip != "") {
		cell.tooltip(tooltip)
	}
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
	if (superparent){superparent.add(button).pad(vars.BarPad).left().size(vars.buttonWidth - mini, vars.buttonHeight - mini)};
	if (return_cell == true){
		return cell;
	} else if (return_cell == 2){
		return [cell, button]
	}else{
		return button
	}
	
};

function instanceButton(icon, tooltip, style, clicked){ // unused
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

// selection menu
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

// selection menu with grid view
function selectgrid(title, tooltips, values, selector, icons, numperrow, defaultText, TextureReg, iconSizeOverride){
	if (values instanceof Seq) {
		values = values.toArray();
	};

	if (TextureReg == undefined){
		TextureReg = false
	}

	if (iconSizeOverride == undefined){
		iconSizeOverride = 0;
	}

	Core.app.post(() => {
		selectgriddialog.rebuild(title, tooltips, values, selector, icons, numperrow, defaultText, TextureReg, iconSizeOverride);
		selectgriddialog.show();
	});
};


// More specific UI stuff
Events.on(EventType.ClientLoadEvent, cons(() => {
	// if(Vars.mobile){
	// 	vars.buttonHeight = vars.mobileHeight;
	// 	vars.buttonWidth = vars.mobileWidth;
	// 	vars.BarPad = vars.mobilePad;
	// 	vars.BarDist = vars.mobileDist;
	// };
	
	selectdialog = extend(BaseDialog, "<title>", {
		rebuild(title, values, selector, names, icons) {
			this.cont.clear();
			this.title.text = title;
			this.cont.pane(t => {
				for (var i in values) {
					const key = i;
					if (icons){
						t.button(names(i, values[i]), new TextureRegionDrawable(icons[i]), vars.iconSize, () => {
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
			}).width(400).top().left();
		}
	});
	selectdialog.addCloseButton();

	selectgriddialog = extend(BaseDialog, "<title>", {
		refresh(tooltips, values, selector, icons, numperrow, TextureReg, iconSizeOverride){
			if (this.cont.getCells().size >= 2){
				this.cont.getCells().get(1).clearElement();
				this.cont.getCells().remove(1);
			}
			this.cont.row();
			this.cont.pane(t => {
				var it = 0;
				for (var i in values){
					if (selectgridfilter && selectgridfilter.trim().length > 0){
						let cfilter = selectgridfilter.trim().toLowerCase()
						if (!tooltips[i].toLowerCase().includes(cfilter)){
							continue
						}
					};
					const key = i;

					if (it++ % numperrow == 0) {
						t.row();
					}
					var icon
					if (TextureReg){
						icon = icons[i]
					}else{
						icon = new TextureRegionDrawable(icons[i])
					}
					
					let b
					if (iconSizeOverride > 0){
						b = t.button(icon, iconSizeOverride, () => {
							selector(values[key]);
							this.hide();
						}).pad(vars.gridPad).size(vars.gridButtonSize);//.tooltip(tooltips[i]);
					}else{
						b = t.button(icon, () => {
							selector(values[key]);
							this.hide();
						}).pad(vars.gridPad).size(vars.gridButtonSize);//.tooltip(tooltips[i]);
					}
					
					let tooltip = new Tooltip(t => {t.background(Tex.button).margin(10).add(tooltips[i]).style(Styles.outlineLabel)})
					b.get().addListener(tooltip)
				};
			}).growX().top().left();
		},

		rebuild(title, tooltips, values, selector, icons, numperrow, defaultText, TextureReg, iconSizeOverride) {
			this.cont.clear();
			selectgridfilter = ""
			this.title.text = title;
			const s = this.cont.table().center().top().get();
			s.defaults().left()
			s.button(Icon.zoom, Styles.flati, () => {
				Core.scene.setKeyboardFocus(search);
			}).size(50, 50).get();
			var search = s.field(selectgridfilter, text => {
				selectgridfilter = text;
				this.refresh(tooltips, values, selector, icons, numperrow, TextureReg, iconSizeOverride);
			}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
			search.setMessageText(defaultText)
			this.refresh(tooltips, values, selector, icons, numperrow, TextureReg, iconSizeOverride);

		}
	});
	selectgriddialog.addCloseButton();
}));

module.exports = {
    createButton : createButton,
    select : select,
    selectgrid : selectgrid,
	click : click,
}