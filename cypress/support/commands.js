// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add("niLogin", (user, loginpage) => {
  cy.visit(loginpage);
  cy.get("input").first().type(user.username);
  cy.get('input[id="mat-input-1"]').type(user.password, { sensitive: true });
  cy.get("mat-select").click().type("{enter}");
  cy.get("form").submit();
});
