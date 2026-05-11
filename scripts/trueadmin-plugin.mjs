#!/usr/bin/env node

import { runPluginCommand } from '../../trueadmin-cli/src/commands/plugin.mjs';

runPluginCommand(process.argv.slice(2));
