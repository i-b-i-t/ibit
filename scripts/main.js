import { system } from "@minecraft/server";
import { wp, wpActionsEnum, wpCommand, back, backCommand } from "./waypoint";
import { fb, fbStatesEnum, nightVisionCommand, tt, ttStatesEnum, autoTotemCommand, dupe, dupeCommand } from "./cheat";
import { kill, suicideCommand1, suicideCommand2 } from "./suicide";

import regulation from "./regulation";
import explosion from "./explosion";
import { reinit, reInitializeCommand, playersCommand, playersList } from "./spawn";

regulation();
explosion();

system.beforeEvents.startup.subscribe(init=>{
    init.customCommandRegistry.registerEnum("ibit:wp_actions", wpActionsEnum);
    init.customCommandRegistry.registerEnum("ibit:fb_states", fbStatesEnum);
    init.customCommandRegistry.registerEnum("ibit:totem_states", ttStatesEnum);
    init.customCommandRegistry.registerCommand(reInitializeCommand, reinit);
    init.customCommandRegistry.registerCommand(playersCommand, playersList);
    init.customCommandRegistry.registerCommand(wpCommand, wp);
    init.customCommandRegistry.registerCommand(nightVisionCommand, fb);
    init.customCommandRegistry.registerCommand(autoTotemCommand, tt);
    init.customCommandRegistry.registerCommand(suicideCommand1, kill);
    init.customCommandRegistry.registerCommand(suicideCommand2, kill);
    init.customCommandRegistry.registerCommand(dupeCommand, dupe);
    init.customCommandRegistry.registerCommand(backCommand, back);
});