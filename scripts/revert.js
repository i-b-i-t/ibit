import { world } from "@minecraft/server";

export default function init() {}

world.afterEvents.itemCompleteUse.subscribe(data=>{
    const { source, itemStack } = data;
    if(source.typeId === "minecraft:player" && itemStack.typeId === "minecraft:enchanted_golden_apple") source.addEffect("minecraft:regeneration", 1200, {
        amplifier: 4,
        showParticles: true
    });
});