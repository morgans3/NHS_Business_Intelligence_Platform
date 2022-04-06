/// <reference types="cypress" />

import { _MYDOMAIN } from "../../../lib/_config";

describe("Test Application", () => {
  beforeEach(() => {
    cy.visit("www." + _MYDOMAIN);
  });

  it("displays login page", () => {
    cy.get("input").should("have.length", 2);
    cy.get("input").first().should("have.value", "");
    cy.get("input").last().should("have.value", "");
  });

  it("attempts login using command", () => {
    cy.fixture("users").then((user) => {
      cy.niLogin(user, "www." + _MYDOMAIN);
      cy.url().should("include", "dashboard");
    });
  });
});
