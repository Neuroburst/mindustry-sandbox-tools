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
	unitstat[rule] = value;
};

function setbStatLocal(rule, value) {
	blockstat[rule] = value;
};

function changeAI(value) {
	selectedai = value;
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