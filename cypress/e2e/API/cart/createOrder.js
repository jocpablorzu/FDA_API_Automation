
describe('Create an order as login customer', () => {
    let authToken;
    let cartId;

    before(() => { // <----------- Autenticacion
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

            // Guardar token 
            authToken = authResponse.body.data.generateCustomerToken.token;
        });
    });

    it('should create a cart, add a product, set shipping address, set billing address, set shipping method, set payment method, and place order', () => {

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

        // Crea el carrito
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

            // Guarda el ID del carrito 
            cartId = createCartResponse.body.data.customerCart.id;

            // Agregar un producto al carrito
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

            // Realiza la solicitud para agregar el producto al carrito
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

                // Verifica que el producto se haya agregado correctamente
                const addedProduct = addProductResponse.body.data.addProductsToCart.cart.items[0];

                // Establecer la dirección de envío
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
                                        city: "Monterrey"
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

                // Realiza la solicitud para establecer la dirección de envío
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
                    }
                }).then((setShippingAddressResponse) => {
                    expect(setShippingAddressResponse.status).to.eq(200);
                    expect(setShippingAddressResponse.body.data.setShippingAddressesOnCart.cart).to.have.property('id');

                    // Verifica que la dirección de envío se haya establecido correctamente
                    const shippingAddress = setShippingAddressResponse.body.data.setShippingAddressesOnCart.cart.shipping_addresses[0];
                    expect(shippingAddress.firstname).to.eq('gustavo adolfo');
                    expect(shippingAddress.lastname).to.eq('parra cerquera');
                    expect(shippingAddress.city).to.eq('Monterrey');
                    expect(shippingAddress.region.code).to.eq('NLE');
                    expect(shippingAddress.postcode).to.eq('64490');
                    expect(shippingAddress.country.code).to.eq('MX');
                    expect(shippingAddress.telephone).to.eq('3192519537');

                    // Establecer la dirección de facturación
                    const setBillingAddressQuery = `
                        mutation SetBillingAddressOnCart($cartId: String!) {
                            setBillingAddressOnCart(
                                input: {
                                    billing_address: {
                                        address: {
                                            firstname: "gustavo adolfo"
                                            lastname: "parra cerquera"
                                            street: "Col Obrera"
                                            city: "Monterrey"
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
                                    cart_id: $cartId
                                }
                            ) {
                                cart {
                                    id
                                    billing_address {
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

                    const setBillingAddressHeaders = {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                        'store': 'app'
                    };

                    // Realiza la solicitud para establecer la dirección de facturación
                    cy.request({
                        method: 'POST',
                        url: 'https://mcstaging.fahorro.com/graphql',
                        headers: setBillingAddressHeaders,
                        body: {
                            query: setBillingAddressQuery,
                            operationName: 'SetBillingAddressOnCart',
                            variables: {
                                cartId: cartId
                            }
                        }
                    }).then((setBillingAddressResponse) => {
                        expect(setBillingAddressResponse.status).to.eq(200);
                        expect(setBillingAddressResponse.body.data.setBillingAddressOnCart.cart).to.have.property('id');

                        // Verifica que la dirección de facturación se haya establecido correctamente
                        const billingAddress = setBillingAddressResponse.body.data.setBillingAddressOnCart.cart.billing_address;
                        expect(billingAddress.firstname).to.eq('gustavo adolfo');
                        expect(billingAddress.lastname).to.eq('parra cerquera');
                        expect(billingAddress.city).to.eq('Monterrey');
                        expect(billingAddress.region.code).to.eq('NLE');
                        expect(billingAddress.postcode).to.eq('64490');
                        expect(billingAddress.country.code).to.eq('MX');
                        expect(billingAddress.telephone).to.eq('3192519537');

                        // Establecer el método de envío
                        const setShippingMethodQuery = `
                            mutation SetShippingMethodsOnCart($cartId: String!) {
                                setShippingMethodsOnCart(
                                    input: {
                                        cart_id: $cartId
                                        shipping_methods: {
                                            carrier_code: "homedelivery"
                                            method_code: "homedelivery"
                                        }
                                    }
                                ) {
                                    cart {
                                        id
                                        shipping_addresses {
                                            selected_shipping_method {
                                                carrier_code
                                                method_code
                                                carrier_title
                                                method_title
                                                amount {
                                                    currency
                                                    value
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        `;

                        const setShippingMethodHeaders = {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json',
                            'store': 'app'
                        };

                        // Realiza la solicitud para establecer el método de envío
                        cy.request({
                            method: 'POST',
                            url: 'https://mcstaging.fahorro.com/graphql',
                            headers: setShippingMethodHeaders,
                            body: {
                                query: setShippingMethodQuery,
                                operationName: 'SetShippingMethodsOnCart',
                                variables: {
                                    cartId: cartId
                                }
                            }
                        }).then((setShippingMethodResponse) => {
                            expect(setShippingMethodResponse.status).to.eq(200);
                            expect(setShippingMethodResponse.body.data.setShippingMethodsOnCart.cart).to.have.property('id');

                            // Verifica que el método de envío se haya establecido correctamente
                            const shippingMethod = setShippingMethodResponse.body.data.setShippingMethodsOnCart.cart.shipping_addresses[0].selected_shipping_method;
                            expect(shippingMethod.carrier_code).to.eq('homedelivery');
                            expect(shippingMethod.method_code).to.eq('homedelivery');

                            // Paso 7: Establecer el método de pago
                            const setPaymentMethodQuery = `
                                mutation SetPaymentMethodOnCart($cartId: String!) {
                                    setPaymentMethodOnCart(
                                        input: { cart_id: $cartId, payment_method: { code: "adyen_cc" } }
                                    ) {
                                        cart {
                                            id
                                            selected_payment_method {
                                                code
                                            }
                                        }
                                    }
                                }
                            `;

                            const setPaymentMethodHeaders = {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json',
                                'store': 'app'
                            };

                            // Realiza la solicitud para establecer el método de pago
                            cy.request({
                                method: 'POST',
                                url: 'https://mcstaging.fahorro.com/graphql',
                                headers: setPaymentMethodHeaders,
                                body: {
                                    query: setPaymentMethodQuery,
                                    operationName: 'SetPaymentMethodOnCart',
                                    variables: {
                                        cartId: cartId
                                    }
                                }
                            }).then((setPaymentMethodResponse) => {
                                expect(setPaymentMethodResponse.status).to.eq(200);
                                expect(setPaymentMethodResponse.body.data.setPaymentMethodOnCart.cart).to.have.property('id');

                                // Verifica que el método de pago se haya establecido correctamente
                                const paymentMethod = setPaymentMethodResponse.body.data.setPaymentMethodOnCart.cart.selected_payment_method;
                                expect(paymentMethod.code).to.eq('adyen_cc');

                                // Realizar el pedido
                                const placeOrderQuery = `
                                    mutation PlaceOrder($cartId: String!) {
                                        placeOrder(input: { cart_id: $cartId, order_comment: "comment test" }) {
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

                                // Realiza la solicitud para realizar el pedido
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
                                    }
                                }).then((placeOrderResponse) => {
                                    expect(placeOrderResponse.status).to.eq(200);
                                    expect(placeOrderResponse.body.data.placeOrder.order).to.have.property('order_number');
                                    expect(placeOrderResponse.body.data.placeOrder.order).to.have.property('order_id');

                                    // Verifica que el pedido se haya realizado correctamente
                                    const order = placeOrderResponse.body.data.placeOrder.order;
                                    expect(order.order_number).to.be.a('string');
                                    expect(order.order_id).to.be.a('string');
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});