import { world, CommandPermissionLevel } from "@minecraft/server";

export const
reInitializeCommand = {
    name: "ibit:reinit",
    description: "Run this if you think some features are not working properly.",
    permissionLevel: CommandPermissionLevel.Any
},
playersCommand = {
    name: "ibit:players",
    description: "See who's playing with (or against) you. Good luck.",
    permissionLevel: CommandPermissionLevel.Any
};

export function reinit(origin){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity;
        const knownPlayers = world.getDynamicProperty("knownPlayers")?.split(",") ?? [];
        if(!knownPlayers.includes(player.name)){
            knownPlayers.push(player.name);
            world.setDynamicProperty("knownPlayers", knownPlayers.join(","));
        }
        player.setDynamicProperty("nightVision", true);
        player.setDynamicProperty("autoTotem", true);
        player.setDynamicProperty("noDarkness", true);
        player.sendMessage("§6[Server] Should be re-initialized now.");
    }
}

export function playersList(origin){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity;
        const knownPlayers = world.getDynamicProperty("knownPlayers")?.split(",") ?? [];
        player.sendMessage("§6[Server] Known players: §f" + (knownPlayers.length > 0 ? knownPlayers.join(", ") : "None"));
    }
}

world.afterEvents.playerSpawn.subscribe(data=>{
    const knownPlayers = world.getDynamicProperty("knownPlayers")?.split(",") ?? [];
    if(!knownPlayers.includes(data.player.name)){
        knownPlayers.push(data.player.name);
        world.setDynamicProperty("knownPlayers", knownPlayers.join(","));
        data.player.sendMessage("§6[Server] Welcome to IBIT! Stay safe out there!");
        data.player.setDynamicProperty("nightVision", true);
        data.player.addEffect("minecraft:night_vision", 999999, {
            amplifier: 0,
            showParticles: false
        });
        data.player.setDynamicProperty("autoTotem", true);
        data.player.setDynamicProperty("noDarkness", true);
    }
    else{
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
    }
});