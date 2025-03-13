describe('Create an order with invalid shipping address', () => {
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

    it('should fail to place an order with invalid shipping address', () => {
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

                const setShippingAddressQuery = `
                    mutation SetShippingAddressesOnCart($cartId: String!) {
                        setShippingAddressesOnCart(
                            input: {
                                cart_id: $cartId
                                shipping_addresses: {
                                    address: {
                                        firstname: "gustavo adolfo"
                                        lastname: "parra cerquera"
                                        street: "Col Obrera"
                                        city: "InvalidCity" // Ciudad inválida
                                        region: "NLE"
                                        region_id: 2857
                                        postcode: "64490"
                                        country_code: "MX"
                                        country_area_code: "+57"
                                        telephone: "3192519537"
                                        save_in_address_book: true
                                        external_number: "23"
                                        internal_number: null
                                        colony: "Sarabia"
                                        municipality: "Monterrey"
                                        between_first_street: "3"
                                        between_second_street: "32"
                                        latitude: "25.68661411599338"
                                        longitude: "-100.31611248850822"
                                        category: "home"
                                        references: "casa"
                                    }
                                }
                            }
                        ) {
                            cart {
                                id
                                shipping_addresses {
                                    firstname
                                    lastname
                                    street
                                    city
                                    region {
                                        code
                                        label
                                    }
                                    postcode
                                    country {
                                        code
                                        label
                                    }
                                    telephone
                                }
                            }
                        }
                    }
                `;

                const setShippingAddressHeaders = {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'store': 'app'
                };

                cy.request({
                    method: 'POST',
                    url: 'https://mcstaging.fahorro.com/graphql',
                    headers: setShippingAddressHeaders,
                    body: {
                        query: setShippingAddressQuery,
                        operationName: 'SetShippingAddressesOnCart',
                        variables: {
                            cartId: cartId
                        }
                    },
                    failOnStatusCode: false
                }).then((setShippingAddressResponse) => {
                    expect(setShippingAddressResponse.status).to.eq(500); // Esperamos un error 500
                    expect(setShippingAddressResponse.body.errors).to.have.length.greaterThan(0);
                });
            });
        });
    });
});