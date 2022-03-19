# NOFU Site
This repo contains the source code for the Northern Freight Unlimited website.

## Layout

* `assets/js`: Calculator Typescript source lives here.
* `_data/`: YAML configuration for the generating the HTML templates.
* `index.md`: Controls which partial templates are rendered onto the page. If the template isn't in this repo, then it's in the theme. We can override with our own if we want, by using `_includes/`.
* `_includes`: Custom HTML goes here. The HTML UI for the calc and a custom fix to our navheader goes here.
* `.github/workflows`: Auto build and publish of the site with Github Actions.

## Running Locally
To run the site locally:
```
bundle exec jekyll server --force-polling
```

## Developing
To get the above command working, you'll need the following installed:

* Ruby 2.7 (or later?)
* Typescript
* Bundler, Gem, etc.
* Jekyll

On WSL2, it wasn't too difficult for me to install things by trying to run `bundle exec jekyll` and following the error messages to install what I needed.


## Attribution
This site is based on the [Agency Jekyll Theme](https://github.com/raviriley/agency-jekyll-theme) Starter Template.