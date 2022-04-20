"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._RequiredSQLTables = void 0;
exports._RequiredSQLTables = [
    {
        name: "cdk-api-postgresql-Outbreak",
        filename: "postgresql",
        functions: [
            {
                method: "mapinfo",
                handlermethod: "getByQueryString",
                methodType: "GET",
                queryString: `SELECT 'FeatureCollection' AS TYPE, array_to_json(array_agg(f)) AS features FROM ( SELECT 'Feature' AS TYPE, ST_AsGeoJSON (lg.geom, 4)::json AS geometry, row_to_json(row(id, "time", lat, lng, tme, optim_var), true) AS properties FROM public.isochrone_outbreak AS lg) AS f`,
                params: [],
            },
        ],
        baseendpoint: "outbreak",
    },
    {
        name: "cdk-api-postgresql-GPPractices",
        filename: "gppractices",
        functions: [
            {
                method: "getAll",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.gps",
                    st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
                    as_properties: `(select row_to_json(_) AS properties from (select lg.organisation_code AS "Code",
            lg.name AS "Name",
            ST_X(lg.geom) AS "Long",
            ST_Y(lg.geom) AS "Lat") as _)
            --row_to_json((organisation_code, name), true) AS properties`,
                    whereclause: "WHERE lg.ccg in ('00Q', '00R', '00X', '01A', '01E', '01K', '02G', '02M') AND (LEFT(lg.organisation_code,1) != 'Y') OR lg.organisation_code='Y01008'",
                },
            },
        ],
        baseendpoint: "gppractices",
        customAuth: "public",
    },
    {
        name: "cdk-api-postgresql-HouseholdIsochrone",
        filename: "postgresql",
        functions: [
            {
                method: "getHousesWithinIsochrone",
                methodType: "POST",
                handlermethod: "getIsoChrone",
                queryString: "",
                params: [],
            },
        ],
        baseendpoint: "isochrone",
    },
    {
        name: "cdk-api-postgresql-Boundaries",
        filename: "orgboundaries",
        baseendpoint: "orgboundaries",
        functions: [
            {
                method: "getTopoJSON",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.icps",
                    st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
                    as_properties: `(select row_to_json(_) AS properties from (select lg.icp AS "ICP") as _)
            --row_to_json((organisation_code, name), true) AS properties`,
                },
            },
        ],
    },
    {
        name: "cdk-api-postgresql-PCNInformation",
        filename: "postgresql",
        baseendpoint: "pcninformation",
        functions: [
            {
                method: "getTopoJSON",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.icps",
                    st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
                    as_properties: `(select row_to_json(_) AS properties from (select lg.icp AS "ICP") as _) --row_to_json((organisation_code, name), true) AS properties`,
                },
            },
            {
                method: "getHexGeojson",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.pcn_hex_geo",
                    st_asgeojson: "lg.geom",
                    as_properties: `(select row_to_json(_) AS properties from (select id, pcn) as _)`,
                },
            },
            {
                method: "getData",
                handlermethod: "getAll",
                methodType: "GET",
                queryString: `public.mosaicpcn`,
                params: [],
            },
        ],
    },
    {
        name: "cdk-api-postgresql-Wards",
        filename: "wards",
        baseendpoint: "wards",
        functions: [
            {
                method: "getAll",
                methodType: "GET",
                handlermethod: "getGeoJson",
                queryString: "",
                params: {
                    tablename: "public.wards",
                    st_asgeojson: "ST_Simplify (lg.geom, 0.0001, TRUE)",
                    as_properties: `(select row_to_json(_) AS properties from (select st_areasha, st_lengths, objectid, lad15nm, lad15cd, wd15nmw, wd15nm, wd15cd) as _) --row_to_json((organisation_code, name), true) AS properties`,
                },
            },
        ],
    },
    {
        name: "cdk-api-postgresql-GrandIndex",
        filename: "postgresql",
        baseendpoint: "grandindex",
        functions: [
            {
                method: "getAll",
                methodType: "GET",
                handlermethod: "getByQueryString",
                queryString: "grandIndexQuery",
                params: [],
            },
        ],
    },
    {
        name: "cdk-api-postgresql-PostCodes",
        filename: "postgresql",
        baseendpoint: "postcodes",
        functions: [
            {
                method: "getAll",
                methodType: "GET",
                handlermethod: "getByQueryString",
                queryString: `SELECT 'FeatureCollection' AS TYPE, array_to_json(array_agg(f)) AS features
          FROM ( SELECT 'Feature' AS TYPE, ST_AsGeoJSON (ST_Simplify (lg.geom, 0.0001, TRUE), 4)::json AS geometry, row_to_json(row(mostype, pop), true) AS properties
          FROM mosaicpostcode AS lg ) AS f`,
                params: [],
            },
        ],
    },
    {
        name: "cdk-api-postgresql-PatientDemographics",
        filename: "postgresql",
        baseendpoint: "demographics",
        functions: [
            {
                method: "demographicsbynhsnumber",
                methodType: "GET",
                handlermethod: "getByRoleQueryAndCondition",
                queryString: `SELECT sex AS Gender, nhs_number AS NHSNumber, address_line_1 AS AddressLine1, address_line_2 AS AddressLine2, address_line_3 AS AddressLine3, address_line_4 AS AddressLine4, address_line_5 AS AddressLine5, postcode AS PostCode, title AS Title, forename AS Forename, other_forenames AS OtherForenames, surname AS Surname, date_of_birth AS DOB FROM public.population_master`,
                params: ["nhs_number"],
                role: "population",
            },
            {
                method: "validateNHSNumber",
                methodType: "POST",
                handlermethod: "validateExists",
                queryString: `SELECT nhs_number, date_of_birth FROM public.population_master`,
                params: ["nhs_number", "date_of_birth"],
                role: "population",
            },
            {
                method: "findMyNHSNumber",
                methodType: "POST",
                handlermethod: "validateExists",
                queryString: `SELECT nhs_number FROM public.population_master`,
                params: ["sex", "date_of_birth", "postcode", "forename"],
            },
        ],
    },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVhLFFBQUEsa0JBQWtCLEdBQW1CO0lBQ2hEO1FBQ0UsSUFBSSxFQUFFLDZCQUE2QjtRQUNuQyxRQUFRLEVBQUUsWUFBWTtRQUN0QixTQUFTLEVBQUU7WUFDVDtnQkFDRSxNQUFNLEVBQUUsU0FBUztnQkFDakIsYUFBYSxFQUFFLGtCQUFrQjtnQkFDakMsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLFdBQVcsRUFBRSxpUkFBaVI7Z0JBQzlSLE1BQU0sRUFBRSxFQUFFO2FBQ1g7U0FDRjtRQUNELFlBQVksRUFBRSxVQUFVO0tBQ3pCO0lBQ0Q7UUFDRSxJQUFJLEVBQUUsZ0NBQWdDO1FBQ3RDLFFBQVEsRUFBRSxhQUFhO1FBQ3ZCLFNBQVMsRUFBRTtZQUNUO2dCQUNFLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixVQUFVLEVBQUUsS0FBSztnQkFDakIsYUFBYSxFQUFFLFlBQVk7Z0JBQzNCLFdBQVcsRUFBRSxFQUFFO2dCQUNmLE1BQU0sRUFBRTtvQkFDTixTQUFTLEVBQUUsWUFBWTtvQkFDdkIsWUFBWSxFQUFFLHFDQUFxQztvQkFDbkQsYUFBYSxFQUFFOzs7O3lFQUlnRDtvQkFDL0QsV0FBVyxFQUFFLHFKQUFxSjtpQkFDbks7YUFDRjtTQUNGO1FBQ0QsWUFBWSxFQUFFLGFBQWE7UUFDM0IsVUFBVSxFQUFFLFFBQVE7S0FDckI7SUFDRDtRQUNFLElBQUksRUFBRSx1Q0FBdUM7UUFDN0MsUUFBUSxFQUFFLFlBQVk7UUFDdEIsU0FBUyxFQUFFO1lBQ1Q7Z0JBQ0UsTUFBTSxFQUFFLDBCQUEwQjtnQkFDbEMsVUFBVSxFQUFFLE1BQU07Z0JBQ2xCLGFBQWEsRUFBRSxjQUFjO2dCQUM3QixXQUFXLEVBQUUsRUFBRTtnQkFDZixNQUFNLEVBQUUsRUFBRTthQUNYO1NBQ0Y7UUFDRCxZQUFZLEVBQUUsV0FBVztLQUMxQjtJQUNEO1FBQ0UsSUFB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QUM7Z0JBQ3RCLElBQUksRUFBRSxZQUFZO2FBQ25CO1lBQ0Q7Z0JBQ0UsTUFBTSxFQUFFLG1CQUFtQjtnQkFDM0IsVUFBVSxFQUFFLE1BQU07Z0JBQ2xCLGFBQWEsRUFBRSxnQkFBZ0I7Z0JBQy9CLFdBQVcsRUFBRSxnRUFBZ0U7Z0JBQzdFLE1BQU0sRUFBRSxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUM7Z0JBQ3ZDLElBQUksRUFBRSxZQUFZO2FBQ25CO1lBQ0Q7Z0JBQ0UsTUFBTSxFQUFFLGlCQUFpQjtnQkFDekIsVUFBVSxFQUFFLE1BQU07Z0JBQ2xCLGFBQWEsRUFBRSxnQkFBZ0I7Z0JBQy9CLFdBQVcsRUFBRSxpREFBaUQ7Z0JBQzlELE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQzthQUN6RDtTQUNGO0tBQ0Y7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGFtYmRhUEdJbmZvIH0gZnJvbSBcIi4uLy4uL2xpYi90eXBlcy9pbnRlcmZhY2VzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgX1JlcXVpcmVkU1FMVGFibGVzOiBMYW1iZGFQR0luZm9bXSA9IFtcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1PdXRicmVha1wiLFxyXG4gICAgZmlsZW5hbWU6IFwicG9zdGdyZXNxbFwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwibWFwaW5mb1wiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QnlRdWVyeVN0cmluZ1wiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IGBTRUxFQ1QgJ0ZlYXR1cmVDb2xsZWN0aW9uJyBBUyBUWVBFLCBhcnJheV90b19qc29uKGFycmF5X2FnZyhmKSkgQVMgZmVhdHVyZXMgRlJPTSAoIFNFTEVDVCAnRmVhdHVyZScgQVMgVFlQRSwgU1RfQXNHZW9KU09OIChsZy5nZW9tLCA0KTo6anNvbiBBUyBnZW9tZXRyeSwgcm93X3RvX2pzb24ocm93KGlkLCBcInRpbWVcIiwgbGF0LCBsbmcsIHRtZSwgb3B0aW1fdmFyKSwgdHJ1ZSkgQVMgcHJvcGVydGllcyBGUk9NIHB1YmxpYy5pc29jaHJvbmVfb3V0YnJlYWsgQVMgbGcpIEFTIGZgLFxyXG4gICAgICAgIHBhcmFtczogW10sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gICAgYmFzZWVuZHBvaW50OiBcIm91dGJyZWFrXCIsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1HUFByYWN0aWNlc1wiLFxyXG4gICAgZmlsZW5hbWU6IFwiZ3BwcmFjdGljZXNcIixcclxuICAgIGZ1bmN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcImdldEFsbFwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRHZW9Kc29uXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICB0YWJsZW5hbWU6IFwicHVibGljLmdwc1wiLFxyXG4gICAgICAgICAgc3RfYXNnZW9qc29uOiBcIlNUX1NpbXBsaWZ5IChsZy5nZW9tLCAwLjAwMDEsIFRSVUUpXCIsXHJcbiAgICAgICAgICBhc19wcm9wZXJ0aWVzOiBgKHNlbGVjdCByb3dfdG9fanNvbihfKSBBUyBwcm9wZXJ0aWVzIGZyb20gKHNlbGVjdCBsZy5vcmdhbmlzYXRpb25fY29kZSBBUyBcIkNvZGVcIixcclxuICAgICAgICAgICAgbGcubmFtZSBBUyBcIk5hbWVcIixcclxuICAgICAgICAgICAgU1RfWChsZy5nZW9tKSBBUyBcIkxvbmdcIixcclxuICAgICAgICAgICAgU1RfWShsZy5nZW9tKSBBUyBcIkxhdFwiKSBhcyBfKVxyXG4gICAgICAgICAgICAtLXJvd190b19qc29uKChvcmdhbmlzYXRpb25fY29kZSwgbmFtZSksIHRydWUpIEFTIHByb3BlcnRpZXNgLFxyXG4gICAgICAgICAgd2hlcmVjbGF1c2U6IFwiV0hFUkUgbGcuY2NnIGluICgnMDBRJywgJzAwUicsICcwMFgnLCAnMDFBJywgJzAxRScsICcwMUsnLCAnMDJHJywgJzAyTScpIEFORCAoTEVGVChsZy5vcmdhbmlzYXRpb25fY29kZSwxKSAhPSAnWScpIE9SIGxnLm9yZ2FuaXNhdGlvbl9jb2RlPSdZMDEwMDgnXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwiZ3BwcmFjdGljZXNcIixcclxuICAgIGN1c3RvbUF1dGg6IFwicHVibGljXCIsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1Ib3VzZWhvbGRJc29jaHJvbmVcIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGZ1bmN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcImdldEhvdXNlc1dpdGhpbklzb2Nocm9uZVwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0SXNvQ2hyb25lXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgICAgICAgcGFyYW1zOiBbXSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwiaXNvY2hyb25lXCIsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImNkay1hcGktcG9zdGdyZXNxbC1Cb3VuZGFyaWVzXCIsXHJcbiAgICBmaWxlbmFtZTogXCJvcmdib3VuZGFyaWVzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwib3JnYm91bmRhcmllc1wiLFxyXG4gICAgZnVuY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0VG9wb0pTT05cIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0R2VvSnNvblwiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBcIlwiLFxyXG4gICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgdGFibGVuYW1lOiBcInB1YmxpYy5pY3BzXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwiU1RfU2ltcGxpZnkgKGxnLmdlb20sIDAuMDAwMSwgVFJVRSlcIixcclxuICAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IGxnLmljcCBBUyBcIklDUFwiKSBhcyBfKVxyXG4gICAgICAgICAgICAtLXJvd190b19qc29uKChvcmdhbmlzYXRpb25fY29kZSwgbmFtZSksIHRydWUpIEFTIHByb3BlcnRpZXNgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtUENOSW5mb3JtYXRpb25cIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJwY25pbmZvcm1hdGlvblwiLFxyXG4gICAgZnVuY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0VG9wb0pTT05cIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0R2VvSnNvblwiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBcIlwiLFxyXG4gICAgICAgIHBhcmFtczoge1xyXG4gICAgICAgICAgdGFibGVuYW1lOiBcInB1YmxpYy5pY3BzXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwiU1RfU2ltcGxpZnkgKGxnLmdlb20sIDAuMDAwMSwgVFJVRSlcIixcclxuICAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IGxnLmljcCBBUyBcIklDUFwiKSBhcyBfKSAtLXJvd190b19qc29uKChvcmdhbmlzYXRpb25fY29kZSwgbmFtZSksIHRydWUpIEFTIHByb3BlcnRpZXNgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0SGV4R2VvanNvblwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRHZW9Kc29uXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICB0YWJsZW5hbWU6IFwicHVibGljLnBjbl9oZXhfZ2VvXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwibGcuZ2VvbVwiLFxyXG4gICAgICAgICAgYXNfcHJvcGVydGllczogYChzZWxlY3Qgcm93X3RvX2pzb24oXykgQVMgcHJvcGVydGllcyBmcm9tIChzZWxlY3QgaWQsIHBjbikgYXMgXylgLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBtZXRob2Q6IFwiZ2V0RGF0YVwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QWxsXCIsXHJcbiAgICAgICAgbWV0aG9kVHlwZTogXCJHRVRcIixcclxuICAgICAgICBxdWVyeVN0cmluZzogYHB1YmxpYy5tb3NhaWNwY25gLFxyXG4gICAgICAgIHBhcmFtczogW10sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtV2FyZHNcIixcclxuICAgIGZpbGVuYW1lOiBcIndhcmRzXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwid2FyZHNcIixcclxuICAgIGZ1bmN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcImdldEFsbFwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiR0VUXCIsXHJcbiAgICAgICAgaGFuZGxlcm1ldGhvZDogXCJnZXRHZW9Kc29uXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IFwiXCIsXHJcbiAgICAgICAgcGFyYW1zOiB7XHJcbiAgICAgICAgICB0YWJsZW5hbWU6IFwicHVibGljLndhcmRzXCIsXHJcbiAgICAgICAgICBzdF9hc2dlb2pzb246IFwiU1RfU2ltcGxpZnkgKGxnLmdlb20sIDAuMDAwMSwgVFJVRSlcIixcclxuICAgICAgICAgIGFzX3Byb3BlcnRpZXM6IGAoc2VsZWN0IHJvd190b19qc29uKF8pIEFTIHByb3BlcnRpZXMgZnJvbSAoc2VsZWN0IHN0X2FyZWFzaGEsIHN0X2xlbmd0aHMsIG9iamVjdGlkLCBsYWQxNW5tLCBsYWQxNWNkLCB3ZDE1bm13LCB3ZDE1bm0sIHdkMTVjZCkgYXMgXykgLS1yb3dfdG9fanNvbigob3JnYW5pc2F0aW9uX2NvZGUsIG5hbWUpLCB0cnVlKSBBUyBwcm9wZXJ0aWVzYCxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLUdyYW5kSW5kZXhcIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJncmFuZGluZGV4XCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJnZXRBbGxcIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QnlRdWVyeVN0cmluZ1wiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBcImdyYW5kSW5kZXhRdWVyeVwiLFxyXG4gICAgICAgIHBhcmFtczogW10sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJjZGstYXBpLXBvc3RncmVzcWwtUG9zdENvZGVzXCIsXHJcbiAgICBmaWxlbmFtZTogXCJwb3N0Z3Jlc3FsXCIsXHJcbiAgICBiYXNlZW5kcG9pbnQ6IFwicG9zdGNvZGVzXCIsXHJcbiAgICBmdW5jdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJnZXRBbGxcIixcclxuICAgICAgICBtZXRob2RUeXBlOiBcIkdFVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwiZ2V0QnlRdWVyeVN0cmluZ1wiLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBgU0VMRUNUICdGZWF0dXJlQ29sbGVjdGlvbicgQVMgVFlQRSwgYXJyYXlfdG9fanNvbihhcnJheV9hZ2coZikpIEFTIGZlYXR1cmVzXHJcbiAgICAgICAgICBGUk9NICggU0VMRUNUICdGZWF0dXJlJyBBUyBUWVBFLCBTVF9Bc0dlb0pTT04gKFNUX1NpbXBsaWZ5IChsZy5nZW9tLCAwLjAwMDEsIFRSVUUpLCA0KTo6anNvbiBBUyBnZW9tZXRyeSwgcm93X3RvX2pzb24ocm93KG1vc3R5cGUsIHBvcCksIHRydWUpIEFTIHByb3BlcnRpZXNcclxuICAgICAgICAgIEZST00gbW9zYWljcG9zdGNvZGUgQVMgbGcgKSBBUyBmYCxcclxuICAgICAgICBwYXJhbXM6IFtdLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiY2RrLWFwaS1wb3N0Z3Jlc3FsLVBhdGllbnREZW1vZ3JhcGhpY3NcIixcclxuICAgIGZpbGVuYW1lOiBcInBvc3RncmVzcWxcIixcclxuICAgIGJhc2VlbmRwb2ludDogXCJkZW1vZ3JhcGhpY3NcIixcclxuICAgIGZ1bmN0aW9uczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcImRlbW9ncmFwaGljc2J5bmhzbnVtYmVyXCIsXHJcbiAgICAgICAgbWV0aG9kVHlwZTogXCJHRVRcIixcclxuICAgICAgICBoYW5kbGVybWV0aG9kOiBcImdldEJ5Um9sZVF1ZXJ5QW5kQ29uZGl0aW9uXCIsXHJcbiAgICAgICAgcXVlcnlTdHJpbmc6IGBTRUxFQ1Qgc2V4IEFTIEdlbmRlciwgbmhzX251bWJlciBBUyBOSFNOdW1iZXIsIGFkZHJlc3NfbGluZV8xIEFTIEFkZHJlc3NMaW5lMSwgYWRkcmVzc19saW5lXzIgQVMgQWRkcmVzc0xpbmUyLCBhZGRyZXNzX2xpbmVfMyBBUyBBZGRyZXNzTGluZTMsIGFkZHJlc3NfbGluZV80IEFTIEFkZHJlc3NMaW5lNCwgYWRkcmVzc19saW5lXzUgQVMgQWRkcmVzc0xpbmU1LCBwb3N0Y29kZSBBUyBQb3N0Q29kZSwgdGl0bGUgQVMgVGl0bGUsIGZvcmVuYW1lIEFTIEZvcmVuYW1lLCBvdGhlcl9mb3JlbmFtZXMgQVMgT3RoZXJGb3JlbmFtZXMsIHN1cm5hbWUgQVMgU3VybmFtZSwgZGF0ZV9vZl9iaXJ0aCBBUyBET0IgRlJPTSBwdWJsaWMucG9wdWxhdGlvbl9tYXN0ZXJgLFxyXG4gICAgICAgIHBhcmFtczogW1wibmhzX251bWJlclwiXSxcclxuICAgICAgICByb2xlOiBcInBvcHVsYXRpb25cIixcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIG1ldGhvZDogXCJ2YWxpZGF0ZU5IU051bWJlclwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwidmFsaWRhdGVFeGlzdHNcIixcclxuICAgICAgICBxdWVyeVN0cmluZzogYFNFTEVDVCBuaHNfbnVtYmVyLCBkYXRlX29mX2JpcnRoIEZST00gcHVibGljLnBvcHVsYXRpb25fbWFzdGVyYCxcclxuICAgICAgICBwYXJhbXM6IFtcIm5oc19udW1iZXJcIiwgXCJkYXRlX29mX2JpcnRoXCJdLFxyXG4gICAgICAgIHJvbGU6IFwicG9wdWxhdGlvblwiLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbWV0aG9kOiBcImZpbmRNeU5IU051bWJlclwiLFxyXG4gICAgICAgIG1ldGhvZFR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhhbmRsZXJtZXRob2Q6IFwidmFsaWRhdGVFeGlzdHNcIixcclxuICAgICAgICBxdWVyeVN0cmluZzogYFNFTEVDVCBuaHNfbnVtYmVyIEZST00gcHVibGljLnBvcHVsYXRpb25fbWFzdGVyYCxcclxuICAgICAgICBwYXJhbXM6IFtcInNleFwiLCBcImRhdGVfb2ZfYmlydGhcIiwgXCJwb3N0Y29kZVwiLCBcImZvcmVuYW1lXCJdLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9LFxyXG5dO1xyXG4iXX0=