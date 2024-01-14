const localF = require("sandbox-tools/localFunctions");

/* Multiplayer Functions */
function definefindp() {
	Call.sendChatMessage("/js findp = name => Groups.player.find(e=>Strings.stripColors(e.name)==name)");
};

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

	localF.healLocal(inv);

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

	localF.setRuleLocal(rule, value, set);
};

function setStatRemote(rule, value, set) {
	let code = ["UnitTypes." + unitstat + "." + rule + "=" + value.toString()];

	Call.sendChatMessage("/js " + code);

	localF.setStatLocal(rule, value, set);
};

function setbStatRemote(rule, value, set) {
	let code = ["Blocks." + blockstat + "." + rule + "=" + value.toString()];

	Call.sendChatMessage("/js " + code);

	localF.setbStatLocal(rule, value, set);
};

function clearbannedRemote(){
	Call.sendChatMessage("/js const blocks = Vars.content.blocks();blocks.each(blo => {try{blo.buildVisibility = BuildVisibility.shown;}catch (e){};});");
	Call.sendChatMessage("/js Vars.state.rules.bannedBlocks=new ObjectSet()");
};