export const grandIndexQuery = `WITH AllVarsConcatTypeAndName AS
(
   SELECT
      "VarId",
      concat('"', "VariableGroup", '"', ':', value) Vars
   FROM
      public.mosaic_grand_index
   WHERE
      LENGTH("VariableGroup") = 3
   ORDER BY
      "row.names"
),
ConcatGroups as
(
   SELECT
      "VarId",
      concat('{', string_agg(Vars, ', '), '}' ) AS AllVarsJson
   FROM
      AllVarsConcatTypeAndName
   GROUP BY
      "VarId"
),
AllVarsDesc as
(
   SELECT DISTINCT
      "VarId",
      "Category",
      "Topic",
      "VariableName"
   FROM
      public.mosaic_grand_index
   ORDER BY
      "VarId"
),
topicId AS
(
   SELECT
      "Category",
      "Topic",
      MIN(CAST("row.names" AS INT) ) TopId
   FROM
      public.mosaic_grand_index
   GROUP BY
      "Category",
      "Topic"
   ORDER BY
      MIN(CAST("row.names" AS INT) )
),
catId AS
(
   SELECT
      "Category",
      MIN(CAST("row.names" AS INT) ) catid
   FROM
      public.mosaic_grand_index
   GROUP BY
      "Category"
   ORDER BY
      MIN(CAST("row.names" AS INT) )
),
groupedIntoTopics AS
(
   SELECT
      Var."Category",
      topid,
      concat('"', Var."Topic", '"', ':{', string_agg( concat( '"', "VariableName" , '"', ':', "allvarsjson"), ', '
   order by
      Var."VarId") , '}' ) AS jsontopic
   FROM
      AllVarsDesc Var
      LEFT JOIN
         ConcatGroups Grp
         ON Var."VarId" = Grp."VarId"
      LEFT JOIN
         topicId tid
         ON Var."Category" = tid."Category"
         AND Var."Topic" = tid."Topic"
   GROUP BY
      Var."Category",
      Var."Topic",
      tid.topid
   ORDER BY
      tid.topid
),
groupedIntoCats as
(
   SELECT
      concat('"', gtp."Category" , '":{',
         string_agg(concat('', "jsontopic", ''), ', '
             order by topid)
       , '}') cats
   FROM
      groupedIntoTopics gtp
      LEFT JOIN
         catId cat
         ON gtp."Category" = cat."Category"
   GROUP BY
      gtp."Category",
      catid
   ORDER BY
      catid
)
SELECT
   concat('{', string_agg(cats, ', '), '}')::json
FROM
   groupedIntoCats`;

export const populationjoined = `SELECT
M.*,
D.local_authority_name as D_local_authority_name, D.gpp_code as D_gpp_code,
D.practice as D_practice, D.age as D_age, D.age_category as D_age_category,
D.sex as D_sex, D.date_of_birth as D_date_of_birth, D.date_of_death as D_date_of_death,
D.title as D_title, D.forename as D_forename, D.other_forenames as D_other_forenames,
D.surname as D_surname, D.address_line_1 as D_address_line_1, D.address_line_2 as D_address_line_2,
D.address_line_3 as D_address_line_3, D.address_line_4 as D_address_line_4, D.address_line_5 as D_address_line_5,
D.postcode as D_postcode, D.ward_name as D_ward_name, D.landline as D_landline, D.mobile as D_mobile,
D.other_shielded_category as D_other_shielded_category, D.assisted_collection as D_assisted_collection,
D.home_care_link as D_home_care_link, D.single_occupancy as D_single_occupancy, D.number_of_occupants as D_number_of_occupants,
D.disabled_facilities_grant as D_disabled_facilities_grant, D.council_tax as D_council_tax, D."neighbourhood_linked_to_PCN" as D_neighbourhood_linked_to_PCN,
D.universal_credit as D_universal_credit, D.housing_benefit as D_housing_benefit, D.business_grant as D_business_grant, D.result as D_result,
D.reason as D_reason, D.contact_date as D_contact_date, D.district as D_district, D.etl_run_date as D_etl_run_date, D.nhs_number as D_nhs_number
FROM
public.population_master M
LEFT JOIN public.district_master D
using(nhs_number)`;
