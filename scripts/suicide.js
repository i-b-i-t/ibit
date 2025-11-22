import { system, CommandPermissionLevel } from "@minecraft/server";

export const
suicideCommand1 = {
    name: "ibit:kill",
    description: "Kill yourself.",
    permissionLevel: CommandPermissionLevel.Any
},
suicideCommand2 = {
    name: "ibit:suicide",
    description: "Kill yourself.",
    permissionLevel: CommandPermissionLevel.Any
};

export function kill(origin){
    if(origin.sourceEntity && origin.sourceEntity.typeId === "minecraft:player") system.run(()=>origin.sourceEntity.kill());
}