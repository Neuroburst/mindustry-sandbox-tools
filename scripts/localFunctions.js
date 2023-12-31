/* Local Functions */
function spawnLocal(spos, count, rand, spawning, team, fuser, fuseMode) {
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

function spawnblockLocal(bpos, block, team) {
	Vars.world.tileWorld(bpos.x, bpos.y).setNet(block, team, 0);
    Fx.spawnShockwave.at(bpos.x, bpos.y, 0);
};

function changeteamLocal(setteam) {
	Vars.player.team(setteam);
};

function applyLocal(effect, duration, perma) {
	let p = Vars.player.unit();
	if(p != null){
		p.apply(effect, perma ? Infinity : duration);
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

function setStatLocal(stat, rule, value) {
	stat[rule] = value;
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

module.exports = {
    spawnLocal : spawnLocal,
    spawnblockLocal : spawnblockLocal,
    changeteamLocal : changeteamLocal,
    applyLocal : applyLocal,
    killLocal : killLocal,
    clearLocal : clearLocal,
    healLocal : healLocal,
    setRuleLocal : setRuleLocal,
    setStatLocal : setStatLocal,
    clearbannedLocal : clearbannedLocal,
}