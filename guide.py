#!/usr/bin/python3
# -*- coding: utf-8 -*-

# Plex DVR EPG listing v0.1
# Jonas Kvarnström (jonas.kvarnstrom@liu.se) 2017-01-30

import argparse
import glob
import sqlite3
import os.path

# Where the script looks for an EPG database
dbpat = "/apps/plexmediaserver/MediaLibrary/Plex Media Server/Plug-in Support/Databases/" \
        "tv.plex.providers.epg.eyeq-*.db"

# Change this to change the style of the web page generated
style = """
<style type="text/css">
    body { max-width: 60em; background-color: white; color: black; }
    h1 { color: white; background-color: black; padding: 0.5ex }
    h2 { color: white; background-color: #404040; padding: 0.3ex }
    .gap { color: darkred; }
    .recorded { color: green; font-weight: bold; }
    .summary { font-size: 85%%; color: #505050; margin-left: 4em; }
    .genre { margin-left: 4em; }
    .origdate { margin-left: 4em; }
    .episodetitle { font-style: italic; font-weight: bold }
    .channellink { display: inline-block; width: 10em; }
    .channellink A { color: black; text-decoration: none; }
</style>
"""


def create_list(dbname, args):
    with sqlite3.connect(dbname) as epgconn, open(args.output, "w") as html:

        html.write("""<html>
<head>
<meta charset="UTF-8">
%s
</head>
<body>\n""" % (style,))

        epgconn.row_factory = sqlite3.Row
        c = epgconn.cursor()

        # type 1 movie
        # type 2 show, 3 season, 4 episode

        query = "SELECT DISTINCT tags.tag as channel " \
                "FROM media_items AS bc " \
                "JOIN metadata_items AS it ON bc.metadata_item_id = it.id " \
                "JOIN tags ON tags.id = bc.channel_id " \
                "ORDER BY bc.channel_id "

        html.write("<h1>Channel Index</h1>")

        channelmap = {}
        chanindex = 0
        for row in c.execute(query):
            chanindex += 1
            channel = row["channel"]
            channelmap[channel] = chanindex
            html.write("<span class=\"channellink\"><a href=\"#%s\">%s</a></span>" %
                       (chanindex, channel))

        query = "SELECT tags.tag as channel, " \
                "bc.begins_at, bc.ends_at, " \
                "it.title, it.user_thumb_url, it.year, it.summary, it.extra_data as subscribed, " \
                "it.\"index\" as episode, it.summary, it.tags_genre as itgenre, " \
                "it.originally_available_at as origdate, " \
                "seas.\"index\" AS season, " \
                "show.title as showtitle, show.tags_genre as showgenre " \
                "FROM media_items AS bc " \
                "JOIN metadata_items AS it ON bc.metadata_item_id = it.id " \
                "JOIN tags ON tags.id = bc.channel_id " \
                "LEFT JOIN metadata_items AS seas ON seas.id = it.parent_id " \
                "LEFT JOIN metadata_items AS show ON show.id = seas.parent_id " \
                "WHERE it.metadata_type IN (1,4) " \
                "ORDER BY bc.channel_id, bc.begins_at "

        prevChannel = None
        prevEnd = None
        prevDate = None

        for row in c.execute(query):

            channel = row["channel"]
            if channel != prevChannel:
                html.write("<h1><a name=\"%s\"></a>Channel: %s</h1>" % (channelmap[channel], channel))
                prevChannel = channel
                prevEnd = None
                prevDate = None

            date = row["begins_at"][:10]
            if date != prevDate:
                html.write("<h2>Date: %s</h2>" % date)
                prevDate = date

            start = row["begins_at"][:-3]
            end = row["ends_at"][:-3]
            shortend = end[11:] if start[:11] == end[:11] else end

            if prevEnd is not None and start != prevEnd:
                html.write("<p class=\"gap\">Gap between %s and %s\n" % (start, shortend))

            if row["season"]:
                # It's an episode
                ep = ("%02d" % row["episode"]) if row["episode"] >= 0 else "??"
                titlestr = ("&ndash; <span class=\"episodetitle\">" + row["title"] + "</span>" if row["title"] else "")
                html.write("<p>%s &ndash; %s: <b>%s</b> S%02dE%s %s\n" %
                           (start, shortend, row["showtitle"], row["season"], ep,
                            titlestr))
            else:
                # It's a movie
                html.write("<p>%s &ndash; %s: <b>%s</b>\n" % # (%d)\n" %
                           (start, end, row["title"]))#, row["year"]))

            # Doesn't mean *this* broadcast will be recorded!
            if row["subscribed"]:
                html.write(" <span class=\"recorded\">*** To be recorded some time ***</span>")

            if args.orig:
                html.write("<p class=\"origdate\">Original air date: %s</p>" % row["origdate"][:10])

            if args.genres:
                if row["itgenre"]:
                    html.write("<p class=\"genre\">Genre: %s</p>" % row["itgenre"])
                if row["showgenre"]:
                    html.write("<p class=\"genre\">Genre: %s</p>" % row["showgenre"])

            if args.summaries:
                html.write("<p class=\"summary\">%s</p>\n" % row["summary"])
            prevEnd = end

        html.write("</body></html>\n")


if __name__ == '__main__':

    parser = argparse.ArgumentParser()
    parser.add_argument("--output", help="Output file/path name (default 'guide.html')", default="guide.html")
    parser.add_argument("--summaries", action="store_true", help="Show movie/episode summaries")
    parser.add_argument("--genres", action="store_true", help="Show movie/showgenres")
    parser.add_argument("--orig", action="store_true", help="Show original air dates")
    args = parser.parse_args()

    dbs = glob.glob(dbpat)

    if len(dbs) == 0:
        print("Found no database matching %s" % dbpat)
    elif len(dbs) > 1:
        print("Found multiple databases matching %s" % dbpat)
    else:
        dbfile = dbs[0]
        if not os.access(dbfile, os.W_OK):
            print("Database file not writable (required for queries): %s" % dbfile)
        else:
            create_list(dbfile, args)
