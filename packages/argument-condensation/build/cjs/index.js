"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsingError = exports.LLMError = exports.ArgumentCondensationError = exports.LanguageConfigs = exports.CONDENSATION_TYPE = exports.exportResults = exports.Condenser = exports.processComments = void 0;
const commentProcessor_1 = require("./utils/commentProcessor");
Object.defineProperty(exports, "processComments", { enumerable: true, get: function () { return commentProcessor_1.processComments; } });
var Condenser_1 = require("./core/Condenser");
Object.defineProperty(exports, "Condenser", { enumerable: true, get: function () { return Condenser_1.Condenser; } });
var fileOperations_1 = require("./utils/fileOperations");
Object.defineProperty(exports, "exportResults", { enumerable: true, get: function () { return fileOperations_1.exportResults; } });
var condensationType_1 = require("./core/types/condensationType");
Object.defineProperty(exports, "CONDENSATION_TYPE", { enumerable: true, get: function () { return condensationType_1.CONDENSATION_TYPE; } });
// Export language namespace
var configs_1 = require("./languageOptions/configs");
Object.defineProperty(exports, "LanguageConfigs", { enumerable: true, get: function () { return configs_1.LanguageConfigs; } });
// Export errors
var errors_1 = require("./core/types/errors");
Object.defineProperty(exports, "ArgumentCondensationError", { enumerable: true, get: function () { return errors_1.ArgumentCondensationError; } });
Object.defineProperty(exports, "LLMError", { enumerable: true, get: function () { return errors_1.LLMError; } });
Object.defineProperty(exports, "ParsingError", { enumerable: true, get: function () { return errors_1.ParsingError; } });
