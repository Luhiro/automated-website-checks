import * as constants from './constants';
import * as pages from './pages';
import * as loginPageObjects from './loginPageObjects';
import * as loginPageData from './loginPageData';
import * as inventoryPageObjects from './inventoryPageObjects';

// Array to store user credentials
const users = [];

describe('Test fixture data', () => {
  it('Loads user data', () => {
    // Visits the test website
    cy.visit(pages.testWebsiteUrl);

    // Extracts user credentials from the login credentials section
    cy.get('#login_credentials').then($loginCredentials => {
      $loginCredentials.contents().each((index, element) => {
        if (element.nodeType === Node.TEXT_NODE && element.parentNode.tagName !== 'H4') {
          const username = element.textContent.trim();
          if (username !== '') {
            users.push(username);
          }
        }
      });
    });
  });
});

describe('Check landing website', () => {
  it('Checks the elements in the landing website are correct', () => {
    // Visits the test website
    cy.visit(pages.testWebsiteUrl);

    // Assert the presence and attributes of landing page elements
    cy.get(`.${loginPageObjects.logoTitle}`)
      .should('exist')
      .should('be.visible')
      .should('contain', loginPageData.logoTitle);

    cy.get(`[data-test=${loginPageObjects.loginUsernameField}]`)
      .should('exist')
      .should('be.visible')
      .should('have.attr', 'placeholder', 'Username');

    cy.get(`[data-test=${loginPageObjects.loginPasswordField}]`)
      .should('exist')
      .should('be.visible')
      .should('have.attr', 'placeholder', 'Password')
      .should('have.attr', 'type', 'password');

    cy.get(`[data-test=${loginPageObjects.loginButton}]`)
      .should('exist')
      .should('be.visible')
      .should('have.attr', 'value', 'Login');
  });
});

describe('Test Login Entries', () => {
  it('Should login with all available user', () => {    
    // Iterates over each user
    users.forEach(credential => {
      // Visits the test website
      cy.visit(pages.testWebsiteUrl);

      // Enters user credentials and login
      cy.get(`[data-test=${loginPageObjects.loginUsernameField}]`).type(credential);
      cy.get(`[data-test=${loginPageObjects.loginPasswordField}]`).type(constants.password);
      cy.get(`[data-test=${loginPageObjects.loginButton}]`).click();
      
      // Checks login result based on user's credentials
      if (credential === 'locked_out_user') {
        cy.get(`[data-test=${loginPageObjects.errorAlert}]`).should('contain', constants.lockedOutErrorMessage);
        cy.get(`.${loginPageObjects.errorButton}`).should('exist').click().should('not.exist');
      } else {
        cy.get(`[data-test=${loginPageObjects.errorAlert}]`).should('not.exist');
        cy.url().should('eq', pages.InventoryPageUrl);
      }
    });
  });
});

describe('Test User Inventories', () => {
  it('Logins with all users and asserts if they have the expected Inventory', () => {   
    // Iterates over each user
    users.forEach(credential => {
      // Visits the test website
      cy.visit(pages.testWebsiteUrl);

      // Logins with user credentials
      cy.get(`[data-test=${loginPageObjects.loginUsernameField}]`).type(credential);
      cy.get(`[data-test=${loginPageObjects.loginPasswordField}]`).type(constants.password);
      cy.get(`[data-test=${loginPageObjects.loginButton}]`).click();
      
      // Checks inventory based on user's credentials
      if (credential !== 'locked_out_user') {
        cy.get(`.${loginPageObjects.errorAlert}`).should('not.exist');
        cy.url().should('eq', pages.InventoryPageUrl);
        cy.get(`.${inventoryPageObjects.inventoryList}`).children().should('have.length', 6);
        
        // Iterates over each product element
        cy.fixture('inventoryData.json').then(inventoryData => {
          cy.get(`.${inventoryPageObjects.inventoryList} .${inventoryPageObjects.inventoryItem}`).each(($productElement, index) => {
            const product = inventoryData[index];
        
            // Extracts product details from the page
            const productName = $productElement.find(`.${inventoryPageObjects.inventoryItemName}`).text().trim();
            const productDescription = $productElement.find(`.${inventoryPageObjects.inventoryItemDescription}`).text().trim();
            const productPrice = $productElement.find(`.${inventoryPageObjects.inventoryItemPrice}`).text().trim();
            const productImageSrc = $productElement.find(`.${inventoryPageObjects.inventoryItemImage} img`).attr('src');

            // Asserts product details
            if (credential === 'problem_user') {
              expect(productName).to.equal(product.name);
              expect(productDescription).to.equal(product.description);
              expect(productPrice).to.equal(product.price);
              expect(productImageSrc).to.equal(constants.defectImage);
            } else if (credential === 'visual_user' && productName === 'Sauce Labs Backpack'){    
              expect(productName).to.equal(product.name);
              expect(productDescription).to.equal(product.description);
              expect(productPrice).to.equal(product.price);
              expect(productImageSrc).to.equal(constants.defectImage);
            } else{
              expect(productName).to.equal(product.name);
              expect(productDescription).to.equal(product.description);
              expect(productPrice).to.equal(product.price);
              expect(productImageSrc).to.equal(product.imageSrc);
            }
          });
        });
      }
    });
  });
});

describe('Test Inventory Website redirect ', () => {
  it('Visits the inventory website without authenthicating', () => {    
    // Visits the inventory page without authenticating
    cy.visit(pages.InventoryPageUrl, { failOnStatusCode: false });

    // Verifies redirection to login page and presence of error message
    cy.url().should('eq', pages.testWebsiteUrl);
    cy.get(`[data-test=${loginPageObjects.errorAlert}]`).should('contain', constants.AccessErrorMessage);
    cy.get(`.${loginPageObjects.errorButton}`).should('exist');
  });
});