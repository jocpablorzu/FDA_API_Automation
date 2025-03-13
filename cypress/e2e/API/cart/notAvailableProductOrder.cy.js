describe('Create an order with unavailable product', () => {
    let authToken;
    let cartId;

    before(() => {
        const authQuery = `
            mutation GenerateCustomerToken {
                generateCustomerToken(
                    email: "gap182@gmail.com"
                    password: "OmniTest2"
                ) {
                    token
                }
            }
        `;

        const authHeaders = {
            'Content-Type': 'application/json',
        };

        cy.request({
            method: 'POST',
            url: 'https://mcstaging.fahorro.com/graphql',
            headers: authHeaders,
            body: {
                query: authQuery,
                operationName: 'GenerateCustomerToken'
            }
        }).then((authResponse) => {
            expect(authResponse.status).to.eq(200);
            expect(authResponse.body.data.generateCustomerToken).to.have.property('token');

            authToken = authResponse.body.data.generateCustomerToken.token;
        });
    });

    it('should fail to place an order with unavailable product', () => {
        const createCartQuery = `
            query CustomerCart {
                customerCart {
                    id
                }
            }
        `;

        const createCartHeaders = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'store': 'app'
        };

        cy.request({
            method: 'POST',
            url: 'https://mcstaging.fahorro.com/graphql',
            headers: createCartHeaders,
            body: {
                query: createCartQuery,
                operationName: 'CustomerCart'
            }
        }).then((createCartResponse) => {
            expect(createCartResponse.status).to.eq(200);
            expect(createCartResponse.body.data.customerCart).to.have.property('id');

            cartId = createCartResponse.body.data.customerCart.id;

            const addProductQuery = `
                mutation AddProductsToCart($cartId: String!) {
                    addProductsToCart(
                        cartId: $cartId
                        cartItems: { sku: "INVALID_SKU", quantity: "2" } // SKU inválido
                    ) {
                        cart {
                            id
                            items {
                                id
                                quantity
                                product {
                                    sku
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const addProductHeaders = {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'store': 'app'
            };

            cy.request({
                method: 'POST',
                url: 'https://mcstaging.fahorro.com/graphql',
                headers: addProductHeaders,
                body: {
                    query: addProductQuery,
                    operationName: 'AddProductsToCart',
                    variables: {
                        cartId: cartId
                    }
                },
                failOnStatusCode: false // Permite que la prueba continúe aunque falle
            }).then((addProductResponse) => {
                expect(addProductResponse.status).to.eq(500); // Esperamos un error 400
                expect(addProductResponse.body.errors).to.have.length.greaterThan(0); // Validamos que el response contenga errores
                expect(addProductResponse.body.errors[0].message).to.include('Product not found'); // Validamos el mensaje de error
            });
        });
    });
});