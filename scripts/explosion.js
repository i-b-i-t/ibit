import { system, world } from "@minecraft/server";

export default function init(){}

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