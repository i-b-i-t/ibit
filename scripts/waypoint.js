import { system, world, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";

export const
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
wpActionsEnum = ["add", "rename", "remove", "clear", "list", "tp"],
backCommand = {
    name: "ibit:back",
    description: "Teleports to last death location after 200 ticks, once per death.",
    permissionLevel: CommandPermissionLevel.Any
};

export function wp(origin, action, name, newName){
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

world.afterEvents.entityDie.subscribe(data=>{
    if(data.deadEntity.typeId === "minecraft:player"){
        data.deadEntity.setDynamicProperty("lastDeathPos", data.deadEntity.location);
        data.deadEntity.setDynamicProperty("lastDeathDim", data.deadEntity.dimension.id);
    }
});

export function back(origin){
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