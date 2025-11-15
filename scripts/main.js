import { world, system, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";

system.beforeEvents.startup.subscribe(init=>{
    const
    wpCommand = {
        name: "ibit:wp",
        description: "Manages waypoints.",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [{
            name: "action",
            type: CustomCommandParamType.Enum,
            enumName: "ibit:wp_actions"
        }],
        optionalParameters: [
            {
                name: "name",
                type: CustomCommandParamType.String
            },
            {
                name: "newName",
                type: CustomCommandParamType.String
            }
        ],
    },
    nightVisionCommand = {
        name: "ibit:fb",
        description: "Toggles auto FullBright.",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [{
            name: "state",
            type: CustomCommandParamType.Enum,
            enumName: "ibit:fb_states"
        }],
    },
    suicideCommand1 = {
        name: "ibit:kill",
        description: "Kill yourself.",
        permissionLevel: CommandPermissionLevel.Any
    },
    suicideCommand2 = {
        name: "ibit:suicide",
        description: "Kill yourself.",
        permissionLevel: CommandPermissionLevel.Any
    },
    dupeCommand = {
        name: "ibit:dupe",
        description: "Duplicates the item in your main hand.",
        permissionLevel: CommandPermissionLevel.Any
    },
    backCommand = {
        name: "ibit:back",
        description: "Teleports to last death location after 200 ticks, once per death.",
        permissionLevel: CommandPermissionLevel.Any
    };
    init.customCommandRegistry.registerEnum("ibit:wp_actions", ["add", "rename", "remove", "clear", "list", "tp"]);
    init.customCommandRegistry.registerEnum("ibit:fb_states", ["on", "off"]);
    init.customCommandRegistry.registerCommand(wpCommand, wp);
    init.customCommandRegistry.registerCommand(nightVisionCommand, fb);
    init.customCommandRegistry.registerCommand(suicideCommand1, kill);
    init.customCommandRegistry.registerCommand(suicideCommand2, kill);
    init.customCommandRegistry.registerCommand(dupeCommand, dupe);
    init.customCommandRegistry.registerCommand(backCommand, back);
});

function wp(origin, action, name, newName){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity;
        switch(action){
            case "add":
                const d = new Date();
                name = name ?? `wp_${d.getHours().toString().padStart(2, "0")}${d.getMinutes().toString().padStart(2, "0")}${d.getSeconds().toString().padStart(2, "0")}`;
                player.setDynamicProperty(`wp_pos_${name}`, {x: player.location.x, y: player.location.y, z: player.location.z});
                player.setDynamicProperty(`wp_dim_${name}`, player.dimension.id);
                player.sendMessage(`§eWaypoint "${name}" added.`);
                break;
            case "rename":
                if(!name || !newName){
                    player.sendMessage("§cBoth old and new waypoint names must be provided.");
                    break;
                }
                const pos = player.getDynamicProperty(`wp_pos_${name}`), dim = player.getDynamicProperty(`wp_dim_${name}`);
                if(!pos || !dim){
                    player.sendMessage(`§cWaypoint "${name}" does not exist.`);
                    break;
                }
                player.setDynamicProperty(`wp_pos_${newName}`, pos);
                player.setDynamicProperty(`wp_dim_${newName}`, dim);
                player.setDynamicProperty(`wp_pos_${name}`, null);
                player.setDynamicProperty(`wp_dim_${name}`, null);
                player.sendMessage(`§eWaypoint "${name}" renamed to "${newName}".`);
                break;
            case "remove":
                if(!name){
                    player.sendMessage("§cWaypoint name must be provided.");
                    break;
                }
                const posToRemove = player.getDynamicProperty(`wp_pos_${name}`), dimToRemove = player.getDynamicProperty(`wp_dim_${name}`);
                if(!posToRemove || !dimToRemove){
                    player.sendMessage(`§cWaypoint "${name}" does not exist.`);
                    break;
                }
                player.setDynamicProperty(`wp_pos_${name}`, null);
                player.setDynamicProperty(`wp_dim_${name}`, null);
                player.sendMessage(`§eWaypoint "${name}" removed.`);
                break;
            case "clear": {
                const keys = player.getDynamicPropertyIds();
                for(let i = 0; i < keys.length; i++) if(keys[i].startsWith("wp_pos_") || keys[i].startsWith("wp_dim_")) player.setDynamicProperty(keys[i], null);
                player.sendMessage("§eAll waypoints cleared.");
                break;
            }
            case "list": {
                const keys = player.getDynamicPropertyIds();
                let count = 0;
                for(let i = 0; i < keys.length; i++) if(keys[i].startsWith("wp_pos_")){
                    const wpName = keys[i].substring(7), value = player.getDynamicProperty(keys[i]), dimId = player.getDynamicProperty(`wp_dim_${wpName}`);
                    player.sendMessage(`§a${wpName}: §b(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)}) in ${dimId}\n`);
                    count++;
                }
                if(count === 0) player.sendMessage("§cNo waypoints found.");
                else player.sendMessage(`§e${count} waypoint${count === 1 ? "" : "s"} listed.`);
                break;
            }
            case "tp":
                if(!name){
                    player.sendMessage("§cWaypoint name must be provided.");
                    break;
                }
                const tpPos = player.getDynamicProperty(`wp_pos_${name}`), tpDimId = player.getDynamicProperty(`wp_dim_${name}`);
                if(!tpPos || !tpDimId){
                    player.sendMessage(`§cWaypoint "${name}" does not exist.`);
                    break;
                }
                if(player.dimension.id !== tpDimId){
                    player.sendMessage(`§cCannot teleport: "${name}" is in a different dimension.`);
                    break;
                }
                let cd = 10;
                system.run(()=>player.onScreenDisplay.setActionBar(`§aTeleporting to "${name}" in ${cd}s...`));
                const id = system.runInterval(()=>{
                    if(cd > 1){
                        cd--;
                        player.onScreenDisplay.setActionBar(`§aTeleporting to "${name}" in ${cd}s...`);
                    }
                    else{
                        system.clearRun(id);
                        player.teleport(tpPos, {dimension: world.getDimension(tpDimId)});
                        player.sendMessage(`§aTeleported to waypoint "${name}".`);
                    }
                }, 20);
                break;
            default:
                player.sendMessage(`§cUnknown action: "${action}".`);
                break;
        }
    }
}

function fb(origin, state){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity;
        if(state === "on") player.setDynamicProperty("nightVision", true);
        else player.setDynamicProperty("nightVision", false);
        player.sendMessage(`[Server] Auto FullBright is ${state === "on" ? "enabled" : "disabled"} for you.`);
    }
}

function kill(origin){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player") system.run(()=>origin.sourceEntity.kill());
}

const DUPE_INTERVAL = 120;

function dupe(origin){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity, lastDuped = player.getDynamicProperty("lastDupeTime");
        if(lastDuped && (Date.now() - lastDuped) < DUPE_INTERVAL * 1000) player.sendMessage(`§cYou may dupe again in ${Math.round((DUPE_INTERVAL * 1000 - (Date.now() - lastDuped)) / 1000)} seconds.`);
        else{
            const item = player.getComponent("minecraft:inventory").container.getItem(player.selectedSlotIndex);
            if(item) {
                system.run(()=>player.dimension.spawnItem(item, player.location));
                player.setDynamicProperty("lastDupeTime", Date.now());
                player.sendMessage("§aItem duplicated.");
            }
            else player.sendMessage("§cNo item in main hand.");
        }
    }
}

function back(origin){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity, lastDeathPos = player.getDynamicProperty("lastDeathPos"), lastDeathDim = player.getDynamicProperty("lastDeathDim");
        if(lastDeathPos && lastDeathDim){
            let cd = 10;
            system.run(()=>player.onScreenDisplay.setActionBar(`§aTeleporting to last death in ${cd}s...`));
            const id = system.runInterval(()=>{
                if(cd > 1){
                    cd--;
                    player.onScreenDisplay.setActionBar(`§aTeleporting to last death in ${cd}s...`);
                }
                else{
                    system.clearRun(id);
                    player.teleport(lastDeathPos, {dimension: world.getDimension(lastDeathDim)});
                    player.setDynamicProperty("lastDeathPos", null);
                    player.setDynamicProperty("lastDeathDim", null);
                    player.sendMessage(`§aTeleported to last death location.`);
                }
            }, 20);
        }
        else player.sendMessage("§cNo last death location found.");
    }
}

world.beforeEvents.entityRemove.subscribe(data=>{
    const {typeId, dimension, location} = data.removedEntity;
    if(typeId === "minecraft:fireworks_rocket") system.run(()=>{
        dimension.createExplosion(location, 6, {
            allowUnderwater: true,
            breaksBlocks: true,
            causesFire: true
        });
    });
    else if(typeId === "minecraft:snowball") system.run(()=>{
        dimension.createExplosion(location, 2, {
            allowUnderwater: false,
            breaksBlocks: false,
            causesFire: false
        });
    });
});

world.afterEvents.playerSpawn.subscribe(data=>{
    if(data.player.getDynamicProperty("nightVision")) data.player.addEffect("minecraft:night_vision", 999999, {
        amplifier: 0,
        showParticles: false
    });
    if(data.initialSpawn) return;
    if(Math.random() < 0.2){
        data.player.sendMessage("§6[Server] Are you feeling lucky?");
        data.player.addEffect("minecraft:health_boost", 999999, {
            amplifier: 15,
            showParticles: false
        });
    }
    if(Math.random() < 0.05){
        data.player.sendMessage("§6[Server] Are you feeling extra lucky?");
        data.player.addEffect("minecraft:health_boost", 999999, {
            amplifier: 40,
            showParticles: false
        });
    }
});

world.afterEvents.entityDie.subscribe(data=>{
    if(data.deadEntity.typeId === "minecraft:player"){
        data.deadEntity.setDynamicProperty("lastDeathPos", data.deadEntity.location);
        data.deadEntity.setDynamicProperty("lastDeathDim", data.deadEntity.dimension.id);
    }
});

const MAXIMUM_CHAT_LENGTH = 128;

world.beforeEvents.chatSend.subscribe(data=>{
    data.cancel = true;
    let purified = data.message.replaceAll(/§+.?/g, ""), exceeds = false;
    if(purified.length > MAXIMUM_CHAT_LENGTH) {
        exceeds = true;
        purified = purified.substring(0, MAXIMUM_CHAT_LENGTH);
    }
    if(purified.startsWith("> ")) world.sendMessage(`<${data.sender.nameTag}> §a${purified.substring(2)}`);
    else world.sendMessage(`<${data.sender.nameTag}> ${purified}`);
    if(exceeds) data.sender.sendMessage(`§cMaximum chat length is ${MAXIMUM_CHAT_LENGTH}. Your message has been truncated.`);
});