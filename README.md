# React-Composite-Pages

React-Composite-Pages composes universal components into pages using any combination of flux implementations.

## Scenarios

A common pattern with React is to separate [Presentational Components from Container Components](http://rackt.org/redux/docs/basics/UsageWithReact.html#container-and-presentational-components). Presentational Components should be dumb--operating only with props and callbacks, whereas Container Components are smart--connected to your Flux implementation, and in charge of managing state.

There are many scenarios for composing multiple React Container Components together onto a single page; including:

1. Interactive navigation components and other common controls
1. Dashboard screens that comprise many independent sections
1. Composition of components using different flux implementations (or versions)

React-Composite-Pages renders multiple Container Components on a page, regardless of flux implementation, yet still achieve universal rendering.

## Running the Examples

To run the examples, you first need to build the react-composite-pages package, and then start up the examples server.  This has all been wrapped up into a single command at the root of the repository

`npm run examples`

## Usage

On the server, you will wrap your Container Components in *Server Pages* that allow for simple async consumption, rendering the Container Components into *Page Templates*.

On the client, you can easily access the server's render state to initialize client-side flux loops and rendering.

### Hello World Example

Here's a bare-bones Hello World example (that does not utilize a flux implementation).

**Presentational Component: `pages/hello/Hello.jsx`**

``` jsx
import React from 'react';

export default React.createClass({
    propTypes: {
        to: React.PropTypes.string.isRequired
    },

    render() {
        return (
            <span>Hello {this.props.to}</span>
        );
    }
});
```

**Server Page: `pages/hello/index.js`**

``` jsx
import React from 'react';
import url from 'url';
import Hello from './Hello';
import template from '../../templates/basic';
import { Container } from 'react-composite-pages';

export default (req, res, callback) => {
    // This could be an async data fetching operation
    const { to = "World" } = url.parse(req.url, true).query;

    // This could be the creation of a flux/redux store
    const state = { to };

    // Load the Template Component using this same approach
    template(req, (Template, templateFunctions) => {
        // Render ourselves inside the loaded Template
        // Specify both a body and a footer for the template
        callback(
            React.createClass({
                render() {
                    return (
                        <Template
                            title={`Hello ${to}`}
                            body={
                                // The body supports universal rendering
                                // It is wrapped in a Container to
                                // configure its required client script,
                                // initial state, and container element id.
                                <Container
                                  clientSrc='/client/pages/hello.js'
                                  id='hello-container'
                                  state={state}>
                                    <Hello to={to} />
                                </Container>
                            }
                            footer={
                                // The footer doesn't use universal rendering
                                // It will be rendered as static HTML
                                <span>It's nice to see you again!</span>
                            }
                        />
                    );
                }
            }),
            // Expose the template's external API functions through ours
            templateFunctions
        );
    });
}
```

**Page Template: `templates/basic.js`**

``` jsx
import React from 'react';
import { renderTemplate, PageClients, PageState } from 'react-composite-pages';

export default (req, res, callback) => {
    // We could perform async operations for loading the template
    callback(
        React.createClass({
            // Define body and footer element properties for the template
            propTypes: {
                body: React.PropTypes.element.isRequired,
                footer: React.PropTypes.element,
                title: React.PropTypes.string.isRequired
            },

            getDefaultProps() {
                return {
                    footer: (
                        <div>React-Composite-Pages</div>
                    ),
                    title: 'React-Composite-Pages'
                };
            },

            render() {
                // Render the template's elements, capturing all of the
                // required state and client scripts.
                const { body, footer } = this.props;
                const template = renderTemplate({ body, footer });

                // The output includes `state` and `clients` components plus
                // a `sections` object with components for each element
                // represented in the template props that were passed in.

                return (
                    <html>
                        <head>
                            <title>{ this.props.title }</title>
                        </head>
                        <body>
                            <template.sections.body />
                            <PageState state={template.state} />
                            <script src='/client/common.js' />
                            <PageClients clients={template.clients} />
                            <hr />
                            <template.sections.footer />
                        </body>
                    </html>
                );
            }
        })
    );
}
```

**Client Entry Point: `pages/hello/client.js`**

This is the client-side bundle entry point for the 'hello' page.

``` jsx
import React from 'react';
import ReactDOM from 'react-dom';
import Hello from './Hello';
import { getContainerState } from 'react-composite-pages/client';

const state = getContainerState('hello-container');
const container = document.getElementById('hello-container');

ReactDOM.render(
    <Hello to={state.to} />,
    container
);
```

**Express Server: `server.js`**

``` jsx
import express from 'express';
import url from 'url';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import routes from './routes';
import { match } from 'react-router';

const app = express();
app.use('/client', express.static('lib/client'));

app.get('*', (req, res, next) => {
    const { query: { pretty } } = url.parse(req.url, true);

    match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
        if (error) {
            res.status(500).send(error.message)
        } else if (redirectLocation) {
            res.redirect(302, redirectLocation.pathname + redirectLocation.search)
        } else if (renderProps) {
            const loadPage = renderProps.components[renderProps.components.length - 1];

            loadPage(req, res, (Page) => {
                res.status(200);

                const send = (pretty ? res.sendHTML : res.send).bind(res);
                send(ReactDOMServer.renderToStaticMarkup(<Page />));
            });
        } else {
            res.status(404).send('Not found')
        }
    });
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});

```

## Rendered HTML

The server is using `ReactDOMServer.renderToStaticMarkup()` to render the `<Page />` that was loaded.  This allows the `<html>` tag and other elements from the page template to be rendered as static HTML rather than with react attributes.

However, if we examine the output for this page, we'll see that react attributes are applied to each element that was within a `<Container>`.

``` html
<html>
<head>
  <title>Hello World</title>
</head>
<body>
  <div>
    <div>
      <div id="hello-container"><span data-reactid=".1dn7u7gyvi8" data-react-checksum="1993289167"><span data-reactid=".1dn7u7gyvi8.0">Hello </span><span data-reactid=".1dn7u7gyvi8.1">World</span></span>
      </div>
      <noscript></noscript>
      <noscript></noscript>
    </div>
  </div>
  <script>
    window.ContainerState = {
      "hello-container": {
        "to": "World"
      }
    };
  </script>
  <script src="/client/common.js"></script>
  <script src="/client/pages/hello.js"></script>
  <hr/>
  <div><span>It&#x27;s nice to see you again!</span></div>
</body>
</html>
```

This happens because the `Container` renders its own children using `ReactDOMServer.renderToString()` and wraps that React-enabled markup in a `<div>`.  In the example above, we see `<div id="hello-container">` that corresponds to the `<Container>`.

This approach ensures that each Container Component can perform client-side rendering cleanly, gaining a flicker-free initial render, and no warnings about rendering React components into elements that themselves were rendered from React.

## Advanced Topics

1. [Usage with Redux](https://github.com/jeffhandley/react-composite-pages/blob/master/docs/usage-with-redux.md)
1. [Usage with Fluxible](https://github.com/jeffhandley/react-composite-pages/blob/master/docs/usage-with-fluxible.md)
1. [Nested page templates](https://github.com/jeffhandley/react-composite-pages/blob/master/docs/nested-page-templates.md)

There's also a post that walks through the inspiration behind React-Composite-Pages:

[A pattern for server-side async data loading with React components](https://gist.github.com/jeffhandley/9dcfe349319fc3583161)

## Summary

The patterns set forth by React-Composite-Pages are very straight-forward:

1. *Server Pages* export functions that accept the request, response, and a callback (similar to Express middleware)
    * The callback will receive a React component
    * Functions can also be specified to represent the Container Component's external API
1. The React components can use *Page Templates* with template sections
    * Template sections are Components wrapped in a `Container`
    * The `Container` receives state and client script to be used for client-side rendering
1. The server simply loads a page and renders its React component
    * The server code does not need to be aware of which page template to render; the page wraps itself in the appropriate template
    * The server code remains independent from any flux implementation in use on the page
1. Client-side entry points load the state and initialize client-side rendering

With this approach, we can easily compose Container Components together into page templates and support universal rendering of any Container Component, regardless of its flux implementation--even mixing flux implementations together cleanly.
