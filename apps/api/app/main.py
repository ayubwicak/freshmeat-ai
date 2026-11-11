from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import (
    APP_DESCRIPTION,
    APP_TITLE,
    APP_VERSION,
    WEB_DIST,
    cors_origins,
)
from app.storage import init_db


def create_app() -> FastAPI:
    application = FastAPI(
        title=APP_TITLE,
        description=APP_DESCRIPTION,
        version=APP_VERSION,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    init_db()
    application.include_router(router)

    WEB_DIST.mkdir(parents=True, exist_ok=True)

    @application.get("/", include_in_schema=False)
    def serve_frontend():
        index_file = WEB_DIST / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)
        return HTMLResponse(
            "<h1>FreshMeat AI</h1>"
            "<p>Frontend React belum di-build. Jalankan "
            "<code>npm install &amp;&amp; npm run build</code> dari root monorepo.</p>",
            status_code=503,
        )

    application.mount(
        "/", StaticFiles(directory=str(WEB_DIST), html=True), name="frontend"
    )

    return application


app = create_app()
