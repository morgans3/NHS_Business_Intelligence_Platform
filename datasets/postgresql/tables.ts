import { LambdaPGInfo } from "../../lib/types/interfaces";

export const _RequiredSQLTables: LambdaPGInfo[] = [
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
