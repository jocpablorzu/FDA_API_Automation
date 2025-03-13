describe('Create an order without payment method', () => {
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

    it('should fail to place an order without payment method', () => {
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
                        cartItems: { sku: "650240032264", quantity: "2" }
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
                }
            }).then((addProductResponse) => {
                expect(addProductResponse.status).to.eq(200);
                expect(addProductResponse.body.data.addProductsToCart.cart).to.have.property('id');
                expect(addProductResponse.body.data.addProductsToCart.cart.items).to.have.length.greaterThan(0);

                const placeOrderQuery = `
                    mutation PlaceOrder($cartId: String!) {
                        placeOrder(input: { cart_id: $cartId }) {
                            order {
                                order_number
                                order_id
                            }
                        }
                    }
                `;

                const placeOrderHeaders = {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'store': 'app'
                };

                cy.request({
                    method: 'POST',
                    url: 'https://mcstaging.fahorro.com/graphql',
                    headers: placeOrderHeaders,
                    body: {
                        query: placeOrderQuery,
                        operationName: 'PlaceOrder',
                        variables: {
                            cartId: cartId
                        }
                    },
                    failOnStatusCode: false // Permite que la prueba continúe aunque falle
                }).then((placeOrderResponse) => {
                    // Validaciones específicas para el error
                    expect(placeOrderResponse.status).to.eq(200); // Aunque hay un error, el status puede ser 200
                    expect(placeOrderResponse.body.errors).to.have.length.greaterThan(0); // Verifica que hay errores
                    expect(placeOrderResponse.body.errors[0].message).to.eq(
                        'Unable to place order: A server error stopped your order from being placed. Please try to place your order again'
                    ); // Valida el mensaje de error exacto
                    expect(placeOrderResponse.body.errors[0].path).to.deep.eq(['placeOrder']); // Valida el path del error
                    expect(placeOrderResponse.body.errors[0].extensions.category).to.eq('graphql-input'); // Valida la categoría del error
                    expect(placeOrderResponse.body.data.placeOrder).to.be.null; // Valida que el campo placeOrder es null
                });
            });
        });
    });
});