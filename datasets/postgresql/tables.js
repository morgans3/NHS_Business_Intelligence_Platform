"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._RequiredSQLTables = void 0;
const postgresql_1 = require("../../src/postgresql/postgresql");
exports._RequiredSQLTables = postgresql_1._SQLSettings; // Table Map for Postgresql is located in the Lambda function so that it can map HTTPS requests based on context.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGdFQUErRDtBQUVsRCxRQUFBLGtCQUFrQixHQUFtQix5QkFBWSxDQUFDLENBQUMsaUhBQWlIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGFtYmRhUEdJbmZvIH0gZnJvbSBcIi4uLy4uL2xpYi90eXBlcy9pbnRlcmZhY2VzXCI7XHJcbmltcG9ydCB7IF9TUUxTZXR0aW5ncyB9IGZyb20gXCIuLi8uLi9zcmMvcG9zdGdyZXNxbC9wb3N0Z3Jlc3FsXCI7XHJcblxyXG5leHBvcnQgY29uc3QgX1JlcXVpcmVkU1FMVGFibGVzOiBMYW1iZGFQR0luZm9bXSA9IF9TUUxTZXR0aW5nczsgLy8gVGFibGUgTWFwIGZvciBQb3N0Z3Jlc3FsIGlzIGxvY2F0ZWQgaW4gdGhlIExhbWJkYSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBtYXAgSFRUUFMgcmVxdWVzdHMgYmFzZWQgb24gY29udGV4dC5cclxuIl19