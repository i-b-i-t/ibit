import { system, world, CommandPermissionLevel, CustomCommandParamType, EntityComponentTypes, ItemComponentTypes, EquipmentSlot } from "@minecraft/server";

export const
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
fbStatesEnum = ["on", "off"],
autoTotemCommand = {
    name: "ibit:totem",
    description: "Toggles Auto Totem.",
    permissionLevel: CommandPermissionLevel.Any,
    mandatoryParameters: [{
        name: "state",
        type: CustomCommandParamType.Enum,
        enumName: "ibit:totem_states"
    }],
},
ttStatesEnum = ["on", "off"],
dupeCommand = {
    name: "ibit:dupe",
    description: "Duplicates the item in your main hand.",
    permissionLevel: CommandPermissionLevel.Any
};

export function fb(origin, state){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity;
        player.setDynamicProperty("nightVision", state === "on");
        player.sendMessage(`[Server] Auto FullBright is ${state === "on" ? "enabled" : "disabled"} for you.`);
    }
}

export function tt(origin, state){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player"){
        const player = origin.sourceEntity;
        player.setDynamicProperty("autoTotem", state === "on");
        player.sendMessage(`[Server] Auto Totem is ${state === "on" ? "enabled" : "disabled"} for you.`);
    }
}

world.afterEvents.entityHealthChanged.subscribe(data=>{
    if(data.entity && data.entity.typeId === "minecraft:player" && data.entity.getDynamicProperty("autoTotem") && data.oldValue <= 0 && data.newValue == 1){
        const
        player = data.entity,
        offhand = player.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(EquipmentSlot.Offhand);
        if(!offhand || !offhand.hasItem()) {
            const inventory = player.getComponent(EntityComponentTypes.Inventory);
            if(inventory && inventory.container){
                const container = inventory.container, slots = [];
                for(let j = 0; j < container.size; j++){
                    const item = container.getItem(j);
                    if(item && item.typeId === "minecraft:totem_of_undying"){
                        //Use hotbar slots last, and prefer right side of hotbar
                        if(j < 8) slots.push(200 - j);
                        else slots.push(j);
                    }
                }
                if(slots.length > 0){
                    player.sendMessage(`§${slots.length > 10 ? "a" : slots.length > 5 ? "6" : slots.length > 2 ? "c" : "c§l"}Totems left: ${slots.length}`);
                    slots.sort((a, b)=>a - b);
                    const totemSlot = slots[0] >= 100 ? 200 - slots[0] : slots[0];
                    const totemItem = container.getItem(totemSlot);
                    if(totemItem && totemItem.typeId === "minecraft:totem_of_undying"){
                        container.setItem(totemSlot, null);
                        offhand.setItem(totemItem);
                    }
                }
                else player.sendMessage("§c§lYou've ran out of Totems!");
            }
        }
        else world.sendMessage(offhand.typeId);
    }
});

const DUPE_INTERVAL = 120;

export function dupe(origin){
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