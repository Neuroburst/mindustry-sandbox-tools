const vars = require("vars")

var selectdialog = null;
var selectgriddialog = null;
var selectgridfilter = "";

/* UI Creation and Utilities (Essentially re-writing certain parts of ui-lib) */
function createButton(parent, superparent, name, icon, tooltip, style, return_cell, clicked){
	var cell = parent.button(icon, style, vars.iconSize, ()=>{});
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
	if (superparent){superparent.add(button).pad(vars.BarPad).left().size(vars.buttonWidth, vars.buttonHeight)};
	if (return_cell){
		return cell;
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
function selectgrid(title, tooltips, values, selector, icons, numperrow){
	if (values instanceof Seq) {
		values = values.toArray();
	};

	Core.app.post(() => {
		selectgriddialog.rebuild(title, tooltips, values, selector, icons, numperrow);
		selectgriddialog.show();
	});
};


// More specific UI stuff
Events.on(EventType.ClientLoadEvent, cons(() => {
	if(Vars.mobile){
		vars.buttonHeight = vars.mobileHeight;
		vars.buttonWidth = vars.mobileWidth;
		vars.BarPad = vars.mobilePad;
		vars.BarDist = vars.mobileDist;
	};
	
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
			}).size(400, 800);
		}
	});
	selectdialog.addCloseButton();

	selectgriddialog = extend(BaseDialog, "<title>", {
		refresh(tooltips, values, selector, icons, numperrow){
			print(tooltips)
			print(values)
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
					const icon = new TextureRegionDrawable(icons[i])
					t.button(icon, () => {
						selector(values[key]);
						this.hide();
					}).pad(vars.gridPad).size(vars.gridButtonSize).tooltip(tooltips[i]);
				};
			}).growX().top().left();
		},

		rebuild(title, tooltips, values, selector, icons, numperrow) {
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
				this.refresh(tooltips, values, selector, icons, numperrow);
			}).padBottom(4).growX().size(vars.searchWidth, 50).tooltip("Search").get();
			this.refresh(tooltips, values, selector, icons, numperrow);

		}
	});
	selectgriddialog.addCloseButton();
}));

module.exports = {
    createButton : createButton,
    select : select,
    selectgrid : selectgrid,
}