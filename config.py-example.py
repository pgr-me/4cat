""" Scraper/worker configuration """

# Postgres login details
DB_HOST = "localhost"
DB_PORT = 5432
DB_USER = "fourcat"
DB_NAME = "fourcat"
DB_PASSWORD = "sup3rs3cr3t"

# Path to folders where logs/images/data may be saved.
# Paths are relative to the folder this config file is in.
PATH_LOGS = ""
PATH_IMAGES = ""  # if left empty or pointing to a non-existent folder, no images will be saved
PATH_DATA = ""
PATH_LOCKFILE = "backend"  # the lockfile will be saved in this folder. Probably no need to change!

# The following two options determine when a warning is logged - e.g. if within
# the last hour less than WARN_POSTS posts are scraped, a warning is logged
# (which may trigger further alerts depending on logger settings)
WARN_POSTS = 500
WARN_THREADS = 50
WARN_JOBS = 5000  # if *more* than this amount of jobs are queued, warn

# E-mails about critical errors are sent to these addresses
WARN_EMAILS = ["admin@4cat.biz"]

# What to scrape?
BOARDS = ["tg", "v"]

# Web tool settings
FLASK_APP = 'fourcat'
FLASK_DEBUG = True
DEBUG = True
SERVER_NAME='localhost:5000'