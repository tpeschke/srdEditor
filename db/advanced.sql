insert into srdadvanced (linkid, body, chapter)
  values ($1, $2, $3)
ON CONFLICT (linkid)
DO Update
  set body = $2, chapter = $3