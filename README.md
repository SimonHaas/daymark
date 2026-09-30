# Daymark

Daymark is a local-first habit tracker. It gives each habit a consistency score from 0 to 100, with recent days weighted more heavily than older days. Your habits are stored in your browser's `localStorage` and are not sent to a server.

## Run locally

Open `index.html` in a browser. No build step or account is required.

## Run with Docker

```sh
docker build -t daymark .
docker run --rm -p 8080:80 daymark
```

Then open <http://localhost:8080>.

## Publish the container image

The GitHub Actions workflow in `.github/workflows/publish-image.yml` builds the image and publishes it to GitHub Container Registry (`ghcr.io`) when code is pushed to `main` or `master`, or when a `v*` tag is pushed. Pull requests build the image without publishing it.

The workflow uses the repository's `GITHUB_TOKEN`; ensure the repository's Actions settings allow the workflow to write packages.
