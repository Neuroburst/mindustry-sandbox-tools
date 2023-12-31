const vars = require("vars")

var selectdialog = null;
var selectgriddialog = null;
/* UI Creation (Essentially re-writing certain parts of ui-lib) */
function createButton(t, it, name, icon, tooltip, style, clicked){
	const cell = t.button(icon, style, vars.iconSize, ()=>{});
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
	it.add(button).pad(vars.BarHeight).left().size(vars.buttonWidth, vars.buttonHeight);
	return button;
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
Events.on(EventType.ClientLoadEvent, cons(() => {
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
}));

module.exports = {
    createButton : createButton,
    instanceButton : instanceButton,
    select : select,
    selectgrid : selectgrid,
}