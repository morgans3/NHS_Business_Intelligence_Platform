"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populationjoined = exports.grandIndexQuery = void 0;
exports.grandIndexQuery = `WITH AllVarsConcatTypeAndName AS
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
exports.populationjoined = `SELECT
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhbmRpbmRleHF1ZXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ3JhbmRpbmRleHF1ZXJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFhLFFBQUEsZUFBZSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7bUJBeUdaLENBQUM7QUFFUCxRQUFBLGdCQUFnQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7OztrQkFpQmQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBncmFuZEluZGV4UXVlcnkgPSBgV0lUSCBBbGxWYXJzQ29uY2F0VHlwZUFuZE5hbWUgQVNcclxuKFxyXG4gICBTRUxFQ1RcclxuICAgICAgXCJWYXJJZFwiLFxyXG4gICAgICBjb25jYXQoJ1wiJywgXCJWYXJpYWJsZUdyb3VwXCIsICdcIicsICc6JywgdmFsdWUpIFZhcnNcclxuICAgRlJPTVxyXG4gICAgICBwdWJsaWMubW9zYWljX2dyYW5kX2luZGV4XHJcbiAgIFdIRVJFXHJcbiAgICAgIExFTkdUSChcIlZhcmlhYmxlR3JvdXBcIikgPSAzXHJcbiAgIE9SREVSIEJZXHJcbiAgICAgIFwicm93Lm5hbWVzXCJcclxuKSxcclxuQ29uY2F0R3JvdXBzIGFzXHJcbihcclxuICAgU0VMRUNUXHJcbiAgICAgIFwiVmFySWRcIixcclxuICAgICAgY29uY2F0KCd7Jywgc3RyaW5nX2FnZyhWYXJzLCAnLCAnKSwgJ30nICkgQVMgQWxsVmFyc0pzb25cclxuICAgRlJPTVxyXG4gICAgICBBbGxWYXJzQ29uY2F0VHlwZUFuZE5hbWVcclxuICAgR1JPVVAgQllcclxuICAgICAgXCJWYXJJZFwiXHJcbiksXHJcbkFsbFZhcnNEZXNjIGFzXHJcbihcclxuICAgU0VMRUNUIERJU1RJTkNUXHJcbiAgICAgIFwiVmFySWRcIixcclxuICAgICAgXCJDYXRlZ29yeVwiLFxyXG4gICAgICBcIlRvcGljXCIsXHJcbiAgICAgIFwiVmFyaWFibGVOYW1lXCJcclxuICAgRlJPTVxyXG4gICAgICBwdWJsaWMubW9zYWljX2dyYW5kX2luZGV4XHJcbiAgIE9SREVSIEJZXHJcbiAgICAgIFwiVmFySWRcIlxyXG4pLFxyXG50b3BpY0lkIEFTXHJcbihcclxuICAgU0VMRUNUXHJcbiAgICAgIFwiQ2F0ZWdvcnlcIixcclxuICAgICAgXCJUb3BpY1wiLFxyXG4gICAgICBNSU4oQ0FTVChcInJvdy5uYW1lc1wiIEFTIElOVCkgKSBUb3BJZFxyXG4gICBGUk9NXHJcbiAgICAgIHB1YmxpYy5tb3NhaWNfZ3JhbmRfaW5kZXhcclxuICAgR1JPVVAgQllcclxuICAgICAgXCJDYXRlZ29yeVwiLFxyXG4gICAgICBcIlRvcGljXCJcclxuICAgT1JERVIgQllcclxuICAgICAgTUlOKENBU1QoXCJyb3cubmFtZXNcIiBBUyBJTlQpIClcclxuKSxcclxuY2F0SWQgQVNcclxuKFxyXG4gICBTRUxFQ1RcclxuICAgICAgXCJDYXRlZ29yeVwiLFxyXG4gICAgICBNSU4oQ0FTVChcInJvdy5uYW1lc1wiIEFTIElOVCkgKSBjYXRpZFxyXG4gICBGUk9NXHJcbiAgICAgIHB1YmxpYy5tb3NhaWNfZ3JhbmRfaW5kZXhcclxuICAgR1JPVVAgQllcclxuICAgICAgXCJDYXRlZ29yeVwiXHJcbiAgIE9SREVSIEJZXHJcbiAgICAgIE1JTihDQVNUKFwicm93Lm5hbWVzXCIgQVMgSU5UKSApXHJcbiksXHJcbmdyb3VwZWRJbnRvVG9waWNzIEFTXHJcbihcclxuICAgU0VMRUNUXHJcbiAgICAgIFZhci5cIkNhdGVnb3J5XCIsXHJcbiAgICAgIHRvcGlkLFxyXG4gICAgICBjb25jYXQoJ1wiJywgVmFyLlwiVG9waWNcIiwgJ1wiJywgJzp7Jywgc3RyaW5nX2FnZyggY29uY2F0KCAnXCInLCBcIlZhcmlhYmxlTmFtZVwiICwgJ1wiJywgJzonLCBcImFsbHZhcnNqc29uXCIpLCAnLCAnXHJcbiAgIG9yZGVyIGJ5XHJcbiAgICAgIFZhci5cIlZhcklkXCIpICwgJ30nICkgQVMganNvbnRvcGljXHJcbiAgIEZST01cclxuICAgICAgQWxsVmFyc0Rlc2MgVmFyXHJcbiAgICAgIExFRlQgSk9JTlxyXG4gICAgICAgICBDb25jYXRHcm91cHMgR3JwXHJcbiAgICAgICAgIE9OIFZhci5cIlZhcklkXCIgPSBHcnAuXCJWYXJJZFwiXHJcbiAgICAgIExFRlQgSk9JTlxyXG4gICAgICAgICB0b3BpY0lkIHRpZFxyXG4gICAgICAgICBPTiBWYXIuXCJDYXRlZ29yeVwiID0gdGlkLlwiQ2F0ZWdvcnlcIlxyXG4gICAgICAgICBBTkQgVmFyLlwiVG9waWNcIiA9IHRpZC5cIlRvcGljXCJcclxuICAgR1JPVVAgQllcclxuICAgICAgVmFyLlwiQ2F0ZWdvcnlcIixcclxuICAgICAgVmFyLlwiVG9waWNcIixcclxuICAgICAgdGlkLnRvcGlkXHJcbiAgIE9SREVSIEJZXHJcbiAgICAgIHRpZC50b3BpZFxyXG4pLFxyXG5ncm91cGVkSW50b0NhdHMgYXNcclxuKFxyXG4gICBTRUxFQ1RcclxuICAgICAgY29uY2F0KCdcIicsIGd0cC5cIkNhdGVnb3J5XCIgLCAnXCI6eycsXHJcbiAgICAgICAgIHN0cmluZ19hZ2coY29uY2F0KCcnLCBcImpzb250b3BpY1wiLCAnJyksICcsICdcclxuICAgICAgICAgICAgIG9yZGVyIGJ5IHRvcGlkKVxyXG4gICAgICAgLCAnfScpIGNhdHNcclxuICAgRlJPTVxyXG4gICAgICBncm91cGVkSW50b1RvcGljcyBndHBcclxuICAgICAgTEVGVCBKT0lOXHJcbiAgICAgICAgIGNhdElkIGNhdFxyXG4gICAgICAgICBPTiBndHAuXCJDYXRlZ29yeVwiID0gY2F0LlwiQ2F0ZWdvcnlcIlxyXG4gICBHUk9VUCBCWVxyXG4gICAgICBndHAuXCJDYXRlZ29yeVwiLFxyXG4gICAgICBjYXRpZFxyXG4gICBPUkRFUiBCWVxyXG4gICAgICBjYXRpZFxyXG4pXHJcblNFTEVDVFxyXG4gICBjb25jYXQoJ3snLCBzdHJpbmdfYWdnKGNhdHMsICcsICcpLCAnfScpOjpqc29uXHJcbkZST01cclxuICAgZ3JvdXBlZEludG9DYXRzYDtcclxuXHJcbmV4cG9ydCBjb25zdCBwb3B1bGF0aW9uam9pbmVkID0gYFNFTEVDVFxyXG5NLiosXHJcbkQubG9jYWxfYXV0aG9yaXR5X25hbWUgYXMgRF9sb2NhbF9hdXRob3JpdHlfbmFtZSwgRC5ncHBfY29kZSBhcyBEX2dwcF9jb2RlLFxyXG5ELnByYWN0aWNlIGFzIERfcHJhY3RpY2UsIEQuYWdlIGFzIERfYWdlLCBELmFnZV9jYXRlZ29yeSBhcyBEX2FnZV9jYXRlZ29yeSxcclxuRC5zZXggYXMgRF9zZXgsIEQuZGF0ZV9vZl9iaXJ0aCBhcyBEX2RhdGVfb2ZfYmlydGgsIEQuZGF0ZV9vZl9kZWF0aCBhcyBEX2RhdGVfb2ZfZGVhdGgsXHJcbkQudGl0bGUgYXMgRF90aXRsZSwgRC5mb3JlbmFtZSBhcyBEX2ZvcmVuYW1lLCBELm90aGVyX2ZvcmVuYW1lcyBhcyBEX290aGVyX2ZvcmVuYW1lcyxcclxuRC5zdXJuYW1lIGFzIERfc3VybmFtZSwgRC5hZGRyZXNzX2xpbmVfMSBhcyBEX2FkZHJlc3NfbGluZV8xLCBELmFkZHJlc3NfbGluZV8yIGFzIERfYWRkcmVzc19saW5lXzIsXHJcbkQuYWRkcmVzc19saW5lXzMgYXMgRF9hZGRyZXNzX2xpbmVfMywgRC5hZGRyZXNzX2xpbmVfNCBhcyBEX2FkZHJlc3NfbGluZV80LCBELmFkZHJlc3NfbGluZV81IGFzIERfYWRkcmVzc19saW5lXzUsXHJcbkQucG9zdGNvZGUgYXMgRF9wb3N0Y29kZSwgRC53YXJkX25hbWUgYXMgRF93YXJkX25hbWUsIEQubGFuZGxpbmUgYXMgRF9sYW5kbGluZSwgRC5tb2JpbGUgYXMgRF9tb2JpbGUsXHJcbkQub3RoZXJfc2hpZWxkZWRfY2F0ZWdvcnkgYXMgRF9vdGhlcl9zaGllbGRlZF9jYXRlZ29yeSwgRC5hc3Npc3RlZF9jb2xsZWN0aW9uIGFzIERfYXNzaXN0ZWRfY29sbGVjdGlvbixcclxuRC5ob21lX2NhcmVfbGluayBhcyBEX2hvbWVfY2FyZV9saW5rLCBELnNpbmdsZV9vY2N1cGFuY3kgYXMgRF9zaW5nbGVfb2NjdXBhbmN5LCBELm51bWJlcl9vZl9vY2N1cGFudHMgYXMgRF9udW1iZXJfb2Zfb2NjdXBhbnRzLFxyXG5ELmRpc2FibGVkX2ZhY2lsaXRpZXNfZ3JhbnQgYXMgRF9kaXNhYmxlZF9mYWNpbGl0aWVzX2dyYW50LCBELmNvdW5jaWxfdGF4IGFzIERfY291bmNpbF90YXgsIEQuXCJuZWlnaGJvdXJob29kX2xpbmtlZF90b19QQ05cIiBhcyBEX25laWdoYm91cmhvb2RfbGlua2VkX3RvX1BDTixcclxuRC51bml2ZXJzYWxfY3JlZGl0IGFzIERfdW5pdmVyc2FsX2NyZWRpdCwgRC5ob3VzaW5nX2JlbmVmaXQgYXMgRF9ob3VzaW5nX2JlbmVmaXQsIEQuYnVzaW5lc3NfZ3JhbnQgYXMgRF9idXNpbmVzc19ncmFudCwgRC5yZXN1bHQgYXMgRF9yZXN1bHQsXHJcbkQucmVhc29uIGFzIERfcmVhc29uLCBELmNvbnRhY3RfZGF0ZSBhcyBEX2NvbnRhY3RfZGF0ZSwgRC5kaXN0cmljdCBhcyBEX2Rpc3RyaWN0LCBELmV0bF9ydW5fZGF0ZSBhcyBEX2V0bF9ydW5fZGF0ZSwgRC5uaHNfbnVtYmVyIGFzIERfbmhzX251bWJlclxyXG5GUk9NXHJcbnB1YmxpYy5wb3B1bGF0aW9uX21hc3RlciBNXHJcbkxFRlQgSk9JTiBwdWJsaWMuZGlzdHJpY3RfbWFzdGVyIERcclxudXNpbmcobmhzX251bWJlcilgO1xyXG4iXX0=